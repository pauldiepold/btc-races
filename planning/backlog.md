# Backlog

Hier landen Themen, die grundsätzlich geplant und durchdacht sind, aber aktuell **nicht umsetzbar** sind — weil externe Abhängigkeiten fehlen, Daten noch nicht verfügbar sind oder die Priorität zu gering ist.

## Handhabung

- Nummerierung: `BL-01`, `BL-02`, ... (fortlaufend, kein Löschen)
- Jeder Eintrag enthält: **Was**, **Warum blockiert**, **Was fehlt noch**, **Kontext-Files**
- Wenn ein Eintrag umsetzbar wird: Eintrag mit `✅` markieren, Datum ergänzen, in den Implementierungsplan übertragen
- Analog zum Implementierungsplan: Einträge werden **nicht gelöscht**, nur mit Status versehen

---

## BL-01 — LADV-Athleten-Nummer aus Campai importieren

**Ursprünglich geplant als:** 9.9.1

**Was zu tun ist:**
1. Neues Feld `ladvAthleteNumber: text()` in `server/db/schema.ts` (Tabelle `users`)
2. `pnpm db:generate` + `pnpm db:migrate`
3. `server/tasks/sync-members.ts` — Campai-Custom-Field auslesen und in `ladvAthleteNumber` speichern
4. `CampaiContact`-Interface in `contacts.service.ts` um das Custom-Feld erweitern

**Warum blockiert:**
- Der Name des Custom-Fields in Campai ist noch nicht bekannt
- Außerdem ist unklar, ob die LADV-Athleten-Nummern in Campai bereits für alle Mitglieder gepflegt sind

**Was fehlt noch:**
- Campai-Feldname (Custom-Field-Key) — vom User nachreichen
- Prüfen, ob Daten vollständig in Campai gepflegt sind

**Auswirkung wenn umgesetzt:**
- LADV-Links auf der Admin-Seite und im Modal können den Athleten vorauswählen:
  - Anmeldung: `https://ladv.de/meldung/addathlet/[ladvId]?aa=[ladvAthleteNumber]`
  - Abmeldung: `https://ladv.de/meldung/removeathlet/[ladvId]?athlet=[ladvAthleteNumber]&raction=addathlet`
- Aktuell funktionieren die Links auch ohne Parameter — der Coach wählt die Person auf LADV manuell aus

**Kontext-Files:** `server/db/schema.ts`, `server/tasks/sync-members.ts`, `server/external-apis/campai-contacts/contacts.service.ts`

---
