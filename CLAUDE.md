# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**BTC Wettkampfanmeldung** — Wettkampf-Anmeldesystem für den Berlin Track Club. Nuxt 4 Full-Stack-App (SSR + API-Routes via Nitro), deployed auf Cloudflare Pages mit D1-Datenbank via NuxtHub.

## Commands

```bash
pnpm dev              # Dev-Server starten (localhost:3000, wendet Migrationen automatisch an)
pnpm build            # Production build
pnpm typecheck        # TypeScript-Typen prüfen — immer mit Exit-Code prüfen: `pnpm typecheck 2>&1; echo "Exit: $?"`
pnpm lint             # ESLint
pnpm lint:fix         # ESLint mit Auto-Fix

# Datenbank
pnpm db:generate      # Migrationen aus Schema-Änderungen generieren
pnpm db:migrate       # Migrationen lokal anwenden
pnpm db:remote:migrate # Migrationen auf Cloudflare D1 (Produktion) anwenden
```

**Typecheck/Lint immer wörtlich so ausführen** — keine ad-hoc `| tail`/`| head` oder abweichenden `echo`-Texte anhängen (jede Variante triggert eine neue Permission-Nachfrage):
- `pnpm typecheck 2>&1; echo "Exit: $?"`
- `pnpm lint:fix`

## Architecture

### Stack
- **Frontend**: Nuxt 4, Vue 3, @nuxt/ui (Tailwind-basiert), Pinia + @pinia/colada
- **Backend**: Nitro (Nuxt Server Engine) mit API-Routes und Tasks
- **Datenbank**: Cloudflare D1 (SQLite) via NuxtHub, ORM: Drizzle
- **Auth**: Passwordless Magic-Link via `nuxt-auth-utils` (Cookie-Session)
- **Email**: Provider-Pattern — Console (dev) oder Azure Communication Services (prod)
- **Deployment**: Cloudflare Pages via NuxtHub

### Verzeichnisstruktur
- `app/` — Frontend (pages, components, middleware, email-templates, assets)
- `server/` — Backend (api-routes, db-schema, tasks, email-service, external APIs)
- `shared/` — Typen, die server- und clientseitig geteilt werden
- `btc-races-v1/` — Altes Vorgänger-Projekt (eingefroren, nicht anfassen)
- [`FEATURES.md`](./FEATURES.md) — Hochrangige Übersicht aller implementierten Features

### Datenbank (Drizzle + NuxtHub)

Schema liegt in `server/db/schema.ts`. Zugriff im Server-Code:
```ts
import { db, schema } from 'hub:db'
```

**Workflow bei Schema-Änderungen:**
1. Schema in `server/db/schema.ts` anpassen
2. `pnpm db:generate` — Migration automatisch generieren lassen
3. `pnpm db:migrate` — lokal anwenden (oder einfach `pnpm dev`)
4. **Niemals** manuell SQL-Migrationsdateien in `server/db/migrations/` erstellen

Typen für client/server-sharing in `shared/types/` ablegen (auto-importiert):
```ts
export type User = typeof schema.users.$inferSelect
```

## Testing

Setup: `vitest`. `pnpm test` (einmalig) / `pnpm test:watch`. Tests in `test/unit/`.

**TDD ist der Standard.** Für neue Features und Bugfixes `/tdd` nutzen — test-first, red-green-refactor. `/test` zieht nach der Umsetzung fehlende Tests nach (Backfill).

Was getestet wird, was nicht, und alle Konventionen: **`docs/agents/testing.md`** — verbindlich für beide Skills und für Ad-hoc-Arbeit.

## Commit & GitHub

Am Ende jeder Session `/commit` aufrufen — der Skill übernimmt Issue-Anlage, FEATURES.md-Update und Commit.


## Neue E-Mail Templates

- Email-Templates: "Dev-Server nach neuen Templates neu starten" ist ein nicht-offensichtlicher Gotcha

## Agent skills

### Issue tracker

Issues leben in GitHub Issues (`pauldiepold/btc-races`), verwaltet über die `gh` CLI. Siehe `docs/agents/issue-tracker.md`.

### Triage labels

Kanonische Default-Namen: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. Siehe `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` am Repo-Root. Siehe `docs/agents/domain.md`.