# BTC Wettkampfanmeldung — Planungsfahrplan

## Wie dieser Plan zu nutzen ist

Jeder Schritt wird in einem **eigenen Chat-Kontext** gestartet — frischer Start, kein aufgeblähter Verlauf.

**Vor jedem neuen Chat:**
1. Den jeweiligen Abschnitt hier lesen (Ziel, Kontext-Files, erwarteter Output)
2. Die verlinkten Kontext-Files öffnen und als Einstieg mitgeben
3. Den Output am Ende im angegebenen File dokumentieren

**Status-Legende:**
- `[laufend]` — in Arbeit
- ✅ — abgeschlossen (archiviert am Ende dieses Dokuments)

**Faustregel:** Abgeschlossene Outputs sind Entscheidungen — nicht nochmal erarbeiten, nur referenzieren.

---

## Aktive Schritte

### Schritt 5 — E-Mail-Inventar

**Ziel:** Alle E-Mails die das System verschickt vollständig dokumentieren, bevor Templates implementiert werden. Basis für die spätere Implementierung der Vue-E-Mail-Templates und des Email-Service.

**Was in einem neuen Chat zu tun ist:**
1. `planning/03-feature-spec.md` lesen — Abschnitt "E-Mail-Trigger-Matrix" und Status-Modell
2. `planning/02-interview-notizen.md` lesen — E-Mail-Anforderungen aus dem Interview
3. Für jeden Trigger (E-01 bis E-08 + ggf. OE-4 Absage-Mail) dokumentieren:
   - **Auslöser** (welches Event im Code, z.B. `POST /api/registrations`)
   - **Empfänger** (Mitglied selbst / Alle Admins / Liste Angemeldeter)
   - **Betreff** (Vorschlag)
   - **Inhalt-Outline** (was muss die Mail enthalten, welche Variablen)
   - **Template-Name** (z.B. `RegistrationConfirmation.vue`)
   - **Priorität** (Must / Could gemäß Feature Spec)

**Output:** `planning/05-email-inventar.md`

---

## Geplante Schritte


### Schritt 8 — Deployment & Ops dokumentieren

**Ziel:** Das bereits fertige Deployment (Cloudflare Pages, NuxtHub, D1, Cron-Setup, Env-Vars) vollständig dokumentieren — sowohl als Referenz für KI-Sessions als auch als Ops-Handbuch.

**Was zu dokumentieren ist:**
- Cloudflare Pages Setup (Build-Befehl, Output-Verzeichnis, Node-Version)
- NuxtHub-Konfiguration und D1-Binding
- Alle Umgebungsvariablen mit Beschreibung und wo sie gesetzt werden (`.env.example` als Basis)
- Cron-Trigger und wie sie aufgerufen werden
- Deployment-Workflow: lokaler Dev → Preview → Production
- Migrations-Workflow remote

**Output:** `planning/08-deployment-ops.md` (und ggf. `CLAUDE.md` ergänzen)

---

### Schritt 10 — Implementierung

Sessions 9.1–9.11 gemäß `planning/09-implementierungsplan.md`.

---

---

---

## Abgeschlossen

### Schritt 9 — Implementierungsplan ✅

**Output:** `planning/09-implementierungsplan.md` — 11 Sessions (9.1–9.11) mit Abhängigkeitsreihenfolge, Feature-Coverage-Übersicht und Session-spezifischen Kontext-Files.

---

### Schritt 1 — Analyse der alten App (`btc-races-v1`) ✅

**Output:** `planning/01-analyse-v1.md` — Schema, Feature-Bestand und offene Fragen vollständig rekonstruiert. Wesentliche Unterschiede v1→v2 dokumentiert.

---

### Schritt 2 — Interview: Scope & neue Anforderungen ✅

**Output:** `planning/02-interview-notizen.md` — Auth-Modell, Event-Typen, LADV-Workflow, E-Mail-Anforderungen und Architekturhinweise abgestimmt.

---

### Schritt 2.2 — Datenmodell-Entwurf ✅

**Output:** `planning/02b-datenmodell-entwurf.md` — 6 ADRs beschlossen (Event-Typen, LADV-Normalisierung, Feldpräzedenz, Disziplinen, Status-Modell, Kommentare). Vollständiges Schema für `events`, `registrations`, `event_comments`, `reactions`.

---

### Schritt 3 — Feature Spec, Priorisierung & Kevin-Review ✅

**Output:** `planning/03-feature-spec.md` — vollständige Feature Spec mit MoSCoW-Priorisierung, Status-Modell, E-Mail-Trigger-Matrix und Kevin-Briefing.

---

### Schritt 4 — Design System & Main Layout ✅

**Output:** Funktionierendes Main Layout, Design-Tokens verankert. UserMenu mit "Meine Anmeldungen"-Link (Desktop + Mobile), Admin-Link im Footer (nur für `role === 'admin'`), `BasePage`/`BaseLayer` entfernt, `events.vue` bereinigt. Details: `planning/04-design-notes.md`.

---

### Schritt 6 — Feature-Finalisierung ✅

**Output:** `03-feature-spec.md` finalisiert. Entscheidungen: OE-1 (Campai-Sync für Startpass), OE-2/OE-4 (Backlog). Neue Features: Superuser-Rolle (F-24 Admin-Seite), Multi-Disziplin-Anmeldung bei LADV-Events. F-04 zur State-Machine-Übersicht zusammengefasst. F-12 Sichtbarkeit korrigiert. Kevin-Briefing abgeschlossen. Offener Folgeschritt: Datenmodell-Update (→ Schritt 6.5).

---

### Schritt 7 — Route Map / API Surface ✅

**Output:** `planning/07-route-map.md` — alle Frontend-Routes (deutsch), API-Endpunkte (englisch), Nitro-Tasks und Middleware vollständig dokumentiert.

---

### Schritt 6.5 — Datenmodell-Update: Multi-Disziplin ✅

**Output:** `02b-datenmodell-entwurf.md` aktualisiert. ADR-007 (Multi-Disziplin) ergänzt, ADR-004 als ersetzt markiert. Neue Tabelle `registration_disciplines` mit UNIQUE `(registration_id, discipline)`. LADV-Operationsfelder von `registrations` auf Disziplin-Ebene verschoben. ADR-001 um `social`-Typ erweitert. Auth-Tabellen (`users`, `auth_tokens`) vollständig dokumentiert.

---

## Rollen im System

| Rolle    | Beschreibung |
|----------|-------------|
| Mitglied | BTC-Mitglied, meldet sich zu Wettkämpfen an |
| Admin    | Coach Kevin oder Vereinsverantwortlicher, verwaltet Wettkämpfe und LADV-Meldungen |
| System   | Automatische Prozesse (Sync, Reminders, LADV-Übertragung) |
