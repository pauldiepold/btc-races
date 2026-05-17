#!/usr/bin/env bash
#
# Spiegelt die prod-D1 (btc-races-prod) in die preview-D1 (btc-races-preview).
# Quell- und Ziel-DB sind hartcodiert. Preview wird komplett geleert und ersetzt.
#
# Ablauf:
#   1. prod komplett dumpen (inkl. d1_migrations-Tabelle)
#   2. alle Tabellen in preview droppen (inkl. d1_migrations)
#   3. Dump in preview importieren -> preview hat prod-State inkl. prod's d1_migrations
#   4. develop-Migrationen anwenden (idempotent: nur fehlende werden ausgeführt)
#   5. push_subscriptions leeren (Schutz vor doppelten Push-Notifications)

set -euo pipefail

SOURCE_DB="btc-races-prod"
TARGET_DB="btc-races-preview"
TARGET_ENV="preview"
SCHEMA_FILE="tmp/prod-schema.sql"
DATA_FILE="tmp/prod-data.sql"
DATA_ORDERED_FILE="tmp/prod-data-ordered.sql"

# INSERT-Reihenfolge: parents vor children. wrangler exportiert alphabetisch,
# D1 ignoriert PRAGMA defer_foreign_keys über Statement-Batches hinweg.
# sqlite_sequence ist absichtlich nicht in der Liste (System-Tabelle, SQLite
# verwaltet sie selbst — INSERT würde knallen, wenn sie noch nicht existiert).
TABLE_ORDER=(
  d1_migrations
  users
  events
  auth_tokens
  registrations
  notification_jobs
  notification_deliveries
  notification_preferences
  push_subscriptions
)

mkdir -p tmp

# Schema und Daten getrennt exportieren: wrangler's kombinierter Dump ordnet
# INSERTs alphabetisch, was bei FK-Tabellen vor parent-Tabellen knallt
# (z. B. INSERT INTO auth_tokens bevor CREATE TABLE users existiert).
echo "==> 1/5 Schema + Daten aus $SOURCE_DB exportieren"
pnpm exec wrangler d1 export "$SOURCE_DB" --remote -y --no-data --output="$SCHEMA_FILE"
pnpm exec wrangler d1 export "$SOURCE_DB" --remote -y --no-schema --output="$DATA_FILE"

echo "==> 2/5 Alle Tabellen in $TARGET_DB droppen (in FK-Reihenfolge)"
# Reihenfolge: children vor parents. Jeder DROP als eigene execute-Call —
# Multi-Statement-DROPs über FK-Tabellen lösen sonst D1_RESET_DO aus.
# Wenn das Schema um Tabellen erweitert wird, hier ergänzen — der Check unten
# fängt vergessene Tabellen ab.
DROP_TABLES=(
  push_subscriptions
  notification_deliveries
  notification_preferences
  notification_jobs
  registrations
  auth_tokens
  events
  users
  d1_migrations
)
for t in "${DROP_TABLES[@]}"; do
  echo "    drop $t"
  pnpm exec wrangler d1 execute "$TARGET_DB" --env "$TARGET_ENV" --remote -y \
    --command="DROP TABLE IF EXISTS \"$t\";" > /dev/null
done

REMAINING=$(pnpm exec wrangler d1 execute "$TARGET_DB" --env "$TARGET_ENV" --remote --json \
  --command="SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%';" \
  | node -e "
    let r='';
    process.stdin.on('data', c => r += c);
    process.stdin.on('end', () => {
      const d = JSON.parse(r);
      const names = (d[0]?.results ?? []).map(x => x.name);
      process.stdout.write(names.join(' '));
    });
  ")

if [ -n "$REMAINING" ]; then
  echo "FEHLER: Tabellen nicht gedroppt (vermutlich neue Tabelle im Schema, die in der Drop-Reihenfolge fehlt): $REMAINING" >&2
  exit 1
fi

echo "==> 3/5 Schema, dann Daten in $TARGET_DB importieren"
pnpm exec wrangler d1 execute "$TARGET_DB" --env "$TARGET_ENV" --remote -y --file="$SCHEMA_FILE"

# Daten in FK-Reihenfolge gruppieren + sqlite_sequence droppen
echo "PRAGMA defer_foreign_keys=TRUE;" > "$DATA_ORDERED_FILE"
TOTAL_INSERTS=0
for t in "${TABLE_ORDER[@]}"; do
  COUNT=$(grep -c "^INSERT INTO \"$t\"" "$DATA_FILE" || true)
  TOTAL_INSERTS=$((TOTAL_INSERTS + COUNT))
  if [ "$COUNT" -gt 0 ]; then
    echo "    $t: $COUNT inserts"
    grep "^INSERT INTO \"$t\"" "$DATA_FILE" >> "$DATA_ORDERED_FILE"
  fi
done

# Sanity-Check: gibt es INSERTs für Tabellen, die nicht in TABLE_ORDER stehen?
ORIGINAL_INSERTS=$(grep -c "^INSERT INTO " "$DATA_FILE" || true)
SKIPPED_NON_SQLITE=$(grep "^INSERT INTO " "$DATA_FILE" | grep -v "^INSERT INTO \"sqlite_sequence\"" | wc -l)
if [ "$TOTAL_INSERTS" -ne "$SKIPPED_NON_SQLITE" ]; then
  echo "FEHLER: INSERTs für unbekannte Tabellen im Dump. TABLE_ORDER ergänzen." >&2
  echo "    erwartet $SKIPPED_NON_SQLITE (ohne sqlite_sequence), gefunden $TOTAL_INSERTS" >&2
  grep "^INSERT INTO " "$DATA_FILE" | awk -F'"' '{print $2}' | sort -u >&2
  exit 1
fi

pnpm exec wrangler d1 execute "$TARGET_DB" --env "$TARGET_ENV" --remote -y --file="$DATA_ORDERED_FILE"

echo "==> 4/5 develop-Migrationen auf $TARGET_DB anwenden"
pnpm exec wrangler d1 migrations apply "$TARGET_DB" --env "$TARGET_ENV" --remote

echo "==> 5/5 push_subscriptions in $TARGET_DB leeren + Cleanup"
pnpm exec wrangler d1 execute "$TARGET_DB" --env "$TARGET_ENV" --remote -y \
  --command="DELETE FROM push_subscriptions;"
rm -f "$SCHEMA_FILE" "$DATA_FILE" "$DATA_ORDERED_FILE"

echo "Fertig. $TARGET_DB spiegelt jetzt $SOURCE_DB (ohne push_subscriptions, mit develop-Migrationen)."
