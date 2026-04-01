# BTC Wettkampfanmeldung — Planungsfahrplan

## Ziel
Strukturierte Anforderungserhebung für Version 2 (Nuxt 4 + Cloudflare D1) des BTC-Wettkampf-Anmeldesystems.
Output: Abgestimmter Feature-Scope als User-Story-Tabelle, bereit für Gespräch mit Coach Kevin.

---

## Schritte (je ein eigener Chat-Kontext)

### Schritt 1 — Analyse der alten App (`btc-races-v1`) ✅
**Ziel:** Verstehen, was bereits existiert und was davon übernommen werden soll.

**Output:** `planning/01-analyse-v1.md` — Schema, Feature-Bestand und offene Fragen vollständig rekonstruiert. Wesentliche Unterschiede v1→v2 dokumentiert.

---

### Schritt 2 — Interview: Scope & neue Anforderungen ✅
**Ziel:** Lücken schließen, neue Anforderungen aufnehmen, Scope grob abgrenzen.

**Output:** `planning/02-interview-notizen.md` — Auth-Modell, Event-Typen, LADV-Workflow, E-Mail-Anforderungen und Architekturhinweise abgestimmt.

---

### Schritt 2.2 — Datenmodell-Entwurf ✅
**Ziel:** Kernentscheidungen im Datenmodell treffen, bevor User Stories formuliert werden.

**Output:** `planning/02b-datenmodell-entwurf.md` — 6 ADRs beschlossen (Event-Typen, LADV-Normalisierung, Feldpräzedenz, Disziplinen, Status-Modell, Kommentare). Vollständiges Schema für `events`, `registrations`, `event_comments`, `reactions`.

---

### Schritt 3 — Feature Spec, Priorisierung & Kevin-Review ✅
**Ziel:** Alle Features strukturiert beschreiben, priorisieren und für Kevin aufbereiten.
**Aufgaben:**
- Feature Catalog mit Akzeptanzkriterien pro Rolle (Athlet, Admin, System)
- MoSCoW-Priorisierung (Must / Should / Could / Won't)
- Status-Modell und E-Mail-Trigger-Matrix
- Offene Entscheidungen mit Empfehlungen
- Kevin-Briefing mit gezielten Fragen

**Kontext-File:** [`planning/03-user-stories-kontext.md`](03-user-stories-kontext.md)
**Output:** `planning/03-feature-spec.md` — vollständige Feature Spec + Kevin-Review-Abschnitt

---

## Rollen im System (vorläufig)

| Rolle    | Beschreibung |
|----------|-------------|
| Athlet   | BTC-Mitglied, meldet sich zu Wettkämpfen an |
| Admin    | Coach Kevin oder Vereinsverantwortlicher, verwaltet Wettkämpfe und LADV-Meldungen |
| System   | Automatische Prozesse (Sync, Reminders, LADV-Übertragung) |

---

## Nächster Schritt

→ **Schritt 3 starten:** [`planning/03-user-stories-kontext.md`](03-user-stories-kontext.md) als Einstieg verwenden
