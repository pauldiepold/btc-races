# BTC Wettkampfanmeldung — Planungsfahrplan

## Wie dieser Plan zu nutzen ist

Jeder Schritt wird in einem **eigenen Chat-Kontext** gestartet — frischer Start, kein aufgeblähter Verlauf.

**Vor jedem neuen Chat:**
1. Den jeweiligen Abschnitt hier lesen (Ziel, Kontext-Files, erwarteter Output)
2. Die verlinkten Kontext-Files öffnen und als Einstieg mitgeben
3. Den Output am Ende im angegebenen File dokumentieren

**Status-Legende:**
- `[laufend]` — in Arbeit
- `[nach Kevin]` — blockiert bis Feature-Scope feststeht
- ✅ — abgeschlossen (archiviert am Ende dieses Dokuments)

**Faustregel:** Abgeschlossene Outputs sind Entscheidungen — nicht nochmal erarbeiten, nur referenzieren.

---

## Aktive Schritte

### Schritt 4 — Design System & Main Layout `[laufend]`

**Ziel:** Ein konsistentes visuelles Fundament etablieren, auf dem alle späteren Feature-Screens aufgebaut werden. Der Main Layout-Shell (AppHeader, Navigation, UserMenu, Inhaltsbereich) ist fertig und alle zentralen Design-Tokens sind in der App verankert.

**Was hier gemacht werden sollte:**
- `.impeccable.md` als Leitfaden nutzen (Yellow/Zinc, Space Grotesk + Raleway, Dark default)
- AppLayout-Komponente mit Header, Navigation und Slot für Page-Content
- Navigation: welche Links für Mitglied vs. Admin (Guard-Logik vorbereiten, aber noch keine Routes implementieren)
- UserMenu: Avatar, Name, Logout — bereits vorhanden, ggf. finalisieren
- Leere States und Page-Header-Muster definieren (wird auf jeder Seite gebraucht)
- Farbtoken-Nutzung dokumentieren: welche `color`-Werte für welche semantischen Zustände (z.B. Status-Badges: `registered` → grün, `canceled` → rot, `maybe` → gelb)

**Vorschlag:** Einen kurzen `planning/04-design-notes.md` anlegen — nicht für fremde, sondern als Gedankenstütze für zukünftige KI-Sessions: "Warum sieht Komponente X so aus?"

**Kontext-Files:** `.impeccable.md`, `app/components/UserMenu.vue`, `app/app.vue`

**Output:** Funktionierendes Main Layout, Design-Tokens verankert

---

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

### Schritt 6 — Kevin-Meeting & Feature-Finalisierung `[extern]`

**Ziel:** Offene Entscheidungen aus `03-feature-spec.md` (OE-1 bis OE-4, F-K1 bis F-K3) klären und den Feature-Scope verbindlich festlegen.

**Nach dem Meeting:**
- `03-feature-spec.md` mit Kevins Entscheidungen aktualisieren (oder separates `03b-kevin-entscheidungen.md`)
- Schritte 7–9 freigeben

---

## Geplante Schritte (nach Kevin-Meeting)

### Schritt 7 — Route Map / API Surface `[nach Kevin]`

**Ziel:** Alle Pages und API-Endpunkte einmalig definieren — als strukturierte Karte für alle späteren Implementierungs-Sessions. Jede KI-Session kann damit sofort verstehen, was wo hingehört.

**Was zu dokumentieren ist:**
- Alle Frontend-Routes (`/`, `/events/[id]`, `/admin/...`) mit Zugriffs-Rolle
- Alle API-Endpunkte (`GET/POST /api/events`, etc.) mit Methode, Auth-Anforderung, kurzer Beschreibung
- Nitro-Tasks und Cron-Endpunkte

**Kontext-Files:** Finalisierte `03-feature-spec.md`, `CLAUDE.md`

**Output:** `planning/07-route-map.md`

---

### Schritt 8 — Deployment & Ops dokumentieren `[nach Kevin]`

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

### Schritt 9 — Implementierungsplan `[nach Kevin]`

**Ziel:** Auf Basis des finalisierten Feature-Scopes und der Route Map eine konkrete Implementierungsreihenfolge festlegen — unter Berücksichtigung von Feature-Abhängigkeiten.

**Grobe Orientierung (wird hier detailliert):**
1. DB-Schema final (Drizzle) + Migrations
2. Auth-Vollständigkeit prüfen / absichern
3. Event-CRUD (Backend + einfaches Admin-UI)
4. Registrierungs-Flow (Backend + Mitglieder-UI)
5. Admin-Workflows (LADV-Status, Kommentare)
6. E-Mail-Templates + Trigger verdrahten
7. Cron-Jobs (Reminder-Mails)
8. Polish & Edge Cases

**Kontext-Files:** `07-route-map.md`, finalisierte `03-feature-spec.md`, `02b-datenmodell-entwurf.md`

**Output:** `planning/09-implementierungsplan.md`

---

### Schritt 10 — Implementierung

Wird nach Schritt 9 in mehrere Einzel-Sessions aufgeteilt, wie im Implementierungsplan festgelegt.

---

---

## Abgeschlossen

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

## Rollen im System

| Rolle    | Beschreibung |
|----------|-------------|
| Mitglied | BTC-Mitglied, meldet sich zu Wettkämpfen an |
| Admin    | Coach Kevin oder Vereinsverantwortlicher, verwaltet Wettkämpfe und LADV-Meldungen |
| System   | Automatische Prozesse (Sync, Reminders, LADV-Übertragung) |
