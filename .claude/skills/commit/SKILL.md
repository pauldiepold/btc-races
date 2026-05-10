---
name: commit
description: Session-Abschluss — Issue sicherstellen und committen. Nutzt den Konversationskontext, kein erneutes Erforschen der Änderungen.
---

# /commit — Session-Abschluss

Die Session weiß schon, was passiert ist. Kein `git diff`, kein FEATURES.md-Check.

## Ablauf

1. **`git status --short`** — nur sehen, welche Dateien betroffen sind.

2. **Issue klären:**
   - Existiert ein Issue für diese Session? Dann Nummer merken.
   - Sonst: `gh issue create --title "<Titel aus Konversation>" --body "<1 Satz>" --label "session-log"`

3. **Commit absetzen:**
   ```bash
   git add <dateien>
   git commit -m "$(cat <<'EOF'
   <type>(<scope>): <kurze deutsche beschreibung>

   Closes #<nummer>
   EOF
   )"
   ```

   - Types: `feat` | `fix` | `refactor` | `docs` | `chore` | `test`
   - Scope: Modul (`auth`, `events`, `ui`, …)
   - Kein `Co-Authored-By`
   - Max. 1 Commit pro Session

Nur wenn der Konversationskontext für Titel/Message nicht reicht, gezielt `git diff <datei>` für einzelne Dateien.
