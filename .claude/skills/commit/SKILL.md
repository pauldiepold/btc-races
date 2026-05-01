---
name: commit
description: Führt den Session-Abschluss durch: Issue anlegen (falls keins vorhanden), FEATURES.md prüfen, Commit erstellen. Aufrufen am Ende jeder Feature-Session.
---

# /commit — Session-Abschluss

## Ablauf

### 1 — Änderungen sichten
```bash
git status --short
git diff HEAD
git log --oneline -5
```

### 2 — Issue klären

**Issue existiert vorab:**
```bash
gh issue view <nummer>   # Titel und Beschreibung für Commit-Message lesen
```

**Kein Issue vorhanden:**
```bash
gh issue create --title "<Titel>" --body "<1-2 Sätze was umgesetzt wurde>" --label "session-log"
```
Erstellte Issue-Nummer merken.

### 3 — FEATURES.md aktualisieren
`FEATURES.md` lesen und prüfen, ob neue oder geänderte Features fehlen. Einträge sind knapp (1 Satz + Issue-Referenz), keine Implementierungsdetails.

### 4 — Commit erstellen

Format: `<type>(<scope>): <beschreibung>`

- **Types:** `feat` | `fix` | `refactor` | `docs` | `chore` | `test`
- **Scope:** Modul-Name (`auth`, `db`, `events`, `ui`, `api`, `notifications`, etc.)
- **Beschreibung:** Deutsch, prägnant, kein Punkt am Ende
- `Closes #<nummer>` im Commit-Body (nicht im Titel)
- Docs-Änderungen (FEATURES.md, CLAUDE.md) im selben Commit
- Kein `Co-Authored-By`

```bash
git add <dateien>
git commit -m "$(cat <<'EOF'
feat(scope): beschreibung

Closes #123
EOF
)"
```

Max. 1 Commit pro Session.

## Labels

| Label | Verwendung |
|---|---|
| `feature` | Neue Funktionalität |
| `enhancement` | Verbesserung eines bestehenden Features |
| `bug` | Etwas funktioniert nicht wie erwartet |
| `chore` | Tech-Debt, Dependencies, Konfiguration |
| `epic` | Sammelt zusammengehörige Issues via Checklist — bleibt offen |
| `blocked` | Wartet auf externe Info oder Abhängigkeit |
| `session-log` | Nachträgliche Doku für kleinere Änderungen ohne Vorab-Issue |
| `documentation` | Reine Doku-Änderungen (README, CLAUDE.md, etc.) |
| `question` | Offene Frage oder Klärungsbedarf |
| `wontfix` | Wird bewusst nicht umgesetzt |
| `duplicate` | Doppeltes Issue |
