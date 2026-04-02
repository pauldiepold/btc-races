# Schritt 9 — Implementierungsplan

_Stand: 2026-04-02_

---

## Wie dieser Plan zu nutzen ist

Jede Session bekommt dieses Dokument + die verlinkten Kontext-Files als Einstieg.  
Sessions sind sequenziell — jede baut auf dem Output der vorherigen auf.  
Abgeschlossene Sessions werden hier als ✅ markiert.

**Kontext-Files für alle Sessions:** `CLAUDE.md`, `planning/02b-datenmodell-entwurf.md`, `planning/03-feature-spec.md`, `planning/07-route-map.md`

---

## Abhängigkeitsübersicht

```
9.1 Schema
  └── 9.2 Auth-Middleware
        └── 9.3 LADV-Client
              └── 9.4 Seeding
                    └── 9.5 Event-Anlegen + Liste
                          └── 9.6 Event-Detail
                                └── 9.7 Event-Bearbeitung & Admin-Aktionen
                                      └── 9.8 Registrierungs-Flow
                                            └── 9.9 Admin-Workflows
                                                  └── 9.10 Kommentare
                                                        └── 9.11 E-Mail
                                                              (setzt Schritt 5 voraus)
```

---

## Sessions

---

### 9.1 — DB-Schema finalisieren

**Ziel:** Alle Tabellen im Drizzle-Schema ergänzen, Migration generieren, Shared Types anlegen.

**Was zu tun ist:**

1. `server/db/schema.ts` erweitern:
   - `events` — vollständig gemäß `02b-datenmodell-entwurf.md`
   - `registrations` — inkl. UNIQUE `(event_id, user_id)`
   - `registration_disciplines` — inkl. UNIQUE `(registration_id, discipline)`, CASCADE DELETE
   - `event_comments` — mit `type: 'comment' | 'announcement'`
   - `reactions` — Schema only, kein UI in v2
   - `sent_emails` — gemäß F-19 in `03-feature-spec.md`
   - `users` updaten: `role` auf `'member' | 'admin' | 'superuser'` erweitern, Feld `has_ladv_startpass` (integer/boolean, default 0) ergänzen

2. `pnpm db:generate` → Migration prüfen → `pnpm db:migrate`

3. Shared Types in `shared/types/` anlegen (alle `$inferSelect`-Typen exportieren, damit sie client- und serverseitig nutzbar sind)

4. Campai-Sync-Task (`server/tasks/sync-members.ts`) anpassen: `has_ladv_startpass` aus der Campai-Response befüllen

**Output:** Schema vollständig, Migration applied, Shared Types verfügbar  
**Kontext-Files:** `02b-datenmodell-entwurf.md`, `server/db/schema.ts`, `server/tasks/sync-members.ts`

---

### 9.2 — Auth-Middleware & Rollenprüfung

**Ziel:** Vollständige, konsistente Auth-Absicherung aller API-Routen. Wiederverwendbare Role-Guard-Utilities für alle weiteren Sessions.

**Was zu tun ist:**

1. `server/middleware/auth.ts` erweitern: alle zu schützenden Präfixe absichern:
   - `/api/events/` — member
   - `/api/registrations/` — member
   - `/api/comments/` — member
   - `/api/me/` — member
   - `/api/cron/` — Bearer-Token-Check (bereits vorhanden, prüfen ob vollständig)

2. Server-Utilities in `server/utils/auth.ts` (oder ähnlich) anlegen:
   - `requireAdmin(event)` — wirft 403 wenn `role !== 'admin' && role !== 'superuser'`
   - `requireSuperuser(event)` — wirft 403 wenn `role !== 'superuser'`
   - `requireOwnerOrAdmin(event, ownerId)` — wirft 403 wenn weder Owner noch Admin/Superuser

3. Client-Middleware prüfen/ergänzen (`app/middleware/auth.global.ts`):
   - Routen `/admin` und `/superuser` auf Rolle prüfen (redirect bei unzureichender Rolle)

**Output:** Alle API-Routen abgesichert, Role-Utilities einsatzbereit  
**Kontext-Files:** `server/middleware/auth.ts`, `app/middleware/auth.global.ts`, `07-route-map.md`

---

### 9.3 — LADV-API-Client

**Ziel:** Wiederverwendbarer Service für LADV-API-Zugriffe. Wird vom Seeding (9.4) und vom Event-Backend (9.5/9.7) genutzt.

**Was zu tun ist:**

1. `pnpm api:generate` ausführen — TypeScript-Typen aus `server/external-apis/schemas/ladv-api-schema.json` generieren

2. `server/external-apis/ladv/ladv.service.ts` anlegen:
   - `fetchAusschreibung(ladvId: number)` — ruft `GET /ausDetail` auf, gibt normalisiertes Objekt zurück
   - Normalisierung: aus LADV-Response die Felder `name`, `date`, `location`, `registration_deadline`, `announcement_link` extrahieren (Mapping LADV-Feldnamen → App-Feldnamen dokumentieren)
   - `parseLadvIdFromUrl(url: string): number | null` — extrahiert LADV-ID aus Ausschreibungslink
   - Fehlerbehandlung: API nicht erreichbar → sprechenden Fehler werfen (wird im Seeding als Fallback-Signal genutzt)

3. (Optional) Fixture-Format festlegen: gecachte LADV-Response als JSON unter `server/db/seed/ladv-fixtures/[id].json`

**Output:** `server/external-apis/ladv/ladv.service.ts` einsatzbereit, Typen generiert  
**Kontext-Files:** `server/external-apis/schemas/ladv-api-schema.json`, `server/external-apis/campai-contacts/contacts.service.ts` (als Referenz für Service-Muster)

---

### 9.4 — Dev-Seeding (F-25)

**Ziel:** Einziger Befehl (`pnpm db:seed`) baut vollständige lokale Entwicklungs-DB mit realistischen Testdaten auf. Alle Features sofort testbar, alle Rollen verfügbar, alle Edge Cases abgedeckt.

**Was zu tun ist:**

`server/tasks/seed.ts` vollständig implementieren — **5 Schritte in Reihenfolge:**

**Schritt 1 — DB leeren**  
`DELETE FROM` aller Tabellen in Abhängigkeitsreihenfolge (reactions → event_comments → registration_disciplines → registrations → sent_emails → auth_tokens → events → users)

**Schritt 2 — Echte Mitglieder (Campai-Sync)**  
Bestehenden Nitro-Task `sync-members` direkt via `runTask('sync-members')` aufrufen

**Schritt 3 — Test-User (per Upsert)**  

| E-Mail | Rolle | Zweck |
|--------|-------|-------|
| paul@… (eigene) | `superuser` | Alle Rechte |
| testadmin@btc-berlin.de | `admin` | Admin-Workflows |
| testmember1@btc-berlin.de | `member` | Mitglied mit Startpass (`has_ladv_startpass = 1`) |
| testmember2@btc-berlin.de | `member` | Mitglied ohne Startpass (`has_ladv_startpass = 0`) |

**Schritt 4 — LADV-Events (echte API + Fixture-Fallback)**  
```ts
const LADV_IDS = [
  // Ausschreibungs-IDs hier eintragen (werden vor Session ergänzt)
]
```
Pro ID: LADV-Service aufrufen → normalisierte Felder + `ladv_data` speichern. Bei API-Fehler: Fallback auf `server/db/seed/ladv-fixtures/[id].json`. Ziel: ~8 Events (5 Zukunft, 3 Vergangenheit).

**Schritt 5 — Generierte Events (Faker `de`-Locale)**  

| Typ | Anzahl | Besonderheiten |
|-----|--------|----------------|
| `competition` | 8 | Meldefrist variiert: abgelaufen / offen / weit in Zukunft |
| `training` | 10 | Mix Vergangenheit/Zukunft |
| `social` | 9 | Mix, ein Event ohne Datum (tbd) |

`created_by` zufällig aus den 4 Test-Usern.

**Schritt 6 — Anmeldungen**  
Zufällige Anmeldungen von Campai-Pool + Test-Usern (3–15 pro Event). Explizit abgedeckte Szenarien (hardcoded):

| Szenario | Beschreibung |
|----------|--------------|
| `registered` + `ladv_registered_at` gesetzt | Kevin hat bereits bei LADV angemeldet |
| `canceled` + `ladv_registered_at` gesetzt | Abgesagt nach LADV-Meldung |
| `canceled` + `ladv_registered_at` + `ladv_canceled_at` | Vollständiger LADV-Abmelde-Flow |
| Anmeldung < 3 Tage vor Meldefrist | E-05-Trigger testbar |
| Anmeldung ohne Startpass bei LADV-Event | F-22-Flow testbar |

**Output:** `pnpm db:seed` läuft durch, alle Features explorierbar  
**Kontext-Files:** `server/tasks/sync-members.ts`, `server/external-apis/ladv/ladv.service.ts`, `02b-datenmodell-entwurf.md`

---

### 9.5 — Event-Anlegen + Liste (F-01, F-07, F-08)

**Ziel:** Events anlegen (manuell + LADV-Import) und als Liste anzeigen. Erste vollständige Seite der App mit echten Daten aus dem Seed.

**Was zu tun ist:**

**Backend:**
- `GET /api/events` — Liste mit Filtern: `type`, `timeRange` (upcoming/past/all), sortiert nach Datum. Eigener Anmeldestatus (join auf `registrations`) wird mitgeliefert.
- `POST /api/events` — Neues Event anlegen (`competition`, `training`, `social`). Pflichtfelder validieren, `created_by` setzen.
- `POST /api/events/ladv-import` — LADV-ID aus URL parsen (LADV-Service), Duplikat-Check (`ladv_id` bereits vorhanden?), normalisierte Felder + `ladv_data` speichern. Redirect-URL in Response zurückgeben.

**Frontend:**
- `/events` — Listenansicht: Typ-Badge, Datum, Ort, Meldefrist, eigener Anmeldestatus. Filter-UI (Typ, Zeitraum). Abgesagte Events mit Badge. Vergangene Events standardmäßig ausgeblendet.
- `/events/neu` — Formular: Name, Datum, Typ, Ort, Meldefrist (wenn `competition`), Ausschreibungslink. Typ `ladv` nicht wählbar.
- `/events/ladv-importieren` — URL-Eingabe, Duplikat-Hinweis mit Link, bei Erfolg Redirect zur Detailseite.

**Output:** Events anlegen und listen funktioniert  
**Kontext-Files:** `03-feature-spec.md` (F-01, F-07, F-08), `07-route-map.md`, `server/external-apis/ladv/ladv.service.ts`

---

### 9.6 — Event-Detail (F-02)

**Ziel:** Die zentrale Seite der App. Zeigt alle Event-Informationen inkl. Teilnehmerliste (noch ohne Anmeldeformular) und Kommentare (Placeholder).

**Was zu tun ist:**

**Backend:**
- `GET /api/events/[id]` — vollständige Event-Daten: normalisierte Felder, `ladv_data` (bei LADV-Events), Anmeldungen (inkl. `registration_disciplines`), Kommentare. Rollensensitive Ausgabe (LADV-Operationsstatus nur für eigene Anmeldung + Admin).

**Frontend (`/events/[id]`):**
- Event-Header: Name, Datum, Ort, Typ-Badge, Meldefrist, Ausschreibungslink, `ladv_last_sync`
- Bei LADV-Events: Metadaten aus `ladv_data` (Veranstalter, Ausrichter, Sportstätte, Wettbewerbe-Tabelle)
- Abgesagt-Banner (wenn `cancelled_at` gesetzt)
- Teilnehmerliste (Basis): Name, Status-Badge, Disziplin + AK (bei LADV), öffentliche Notiz
- Placeholder-Bereich für Anmeldeformular (folgt in 9.8) und Kommentare (folgt in 9.10)
- Rollensensitive Elemente vorbereiten (Sichtbarkeit wird in 9.7 und 9.9 befüllt)

**Hinweis:** Die Detailseite wird in späteren Sessions iterativ erweitert (Anmeldeformular in 9.8, Admin-Buttons in 9.7+9.9, Kommentare in 9.10). Hier wird die Grundstruktur gelegt.

**Output:** `/events/[id]` rendert vollständige Event-Infos + Teilnehmerliste  
**Kontext-Files:** `03-feature-spec.md` (F-02, F-12), `02b-datenmodell-entwurf.md`

---

### 9.7 — Event-Bearbeitung & Admin-Aktionen (F-09, F-10, F-11)

**Ziel:** Admins und Ersteller können Events bearbeiten. Admin kann absagen und LADV-Daten synchronisieren.

**Was zu tun ist:**

**Backend:**
- `PATCH /api/events/[id]` — Felder editieren (Name, Datum, Ort, Meldefrist, Ausschreibungslink). Auth: `requireOwnerOrAdmin()`. Typ-Änderung nicht erlaubt.
- `POST /api/events/[id]/cancel` — `cancelled_at` setzen. Auth: `requireAdmin()`.
- `POST /api/events/[id]/sync` — LADV-Service aufrufen, nur `ladv_data` + `ladv_last_sync` aktualisieren, ggf. `cancelled_at` setzen (wenn LADV `abgesagt: true`). Auth: `requireAdmin()`.

**Frontend:**
- `/events/[id]/bearbeiten` — Formular mit existierenden Werten vorbelegt. Zugriff: Admin oder Ersteller.
- Event-Detailseite (`/events/[id]`) erweitern (admin-only Bereiche):
  - Sync-Button + letzter Sync-Zeitpunkt (bei LADV-Events)
  - Diff-Hinweis: wenn `name`, `date`, `location` oder `registration_deadline` von `ladv_data` abweichen → visueller Hinweis pro Feld mit "Übernehmen"-Button
  - Absagen-Button mit Bestätigungsdialog

**Output:** Event-Verwaltung vollständig  
**Kontext-Files:** `03-feature-spec.md` (F-09, F-10, F-11), `server/external-apis/ladv/ladv.service.ts`

---

### 9.8 — Registrierungs-Flow (F-03, F-04, F-06, F-12 member, F-22)

**Ziel:** Mitglieder können sich anmelden, ihre Anmeldung bearbeiten und eine Übersicht ihrer Anmeldungen sehen.

**Was zu tun ist:**

**Backend:**
- `POST /api/events/[id]/registrations` — Anmeldung erstellen. Validierung:
  - Meldefrist noch nicht abgelaufen (bei `ladv` + `competition`)
  - Event nicht abgesagt
  - Keine Doppelanmeldung (UNIQUE constraint)
  - Bei `ladv`: mindestens eine Disziplin angegeben
  - Bei `ladv`: `has_ladv_startpass = true` (F-22) — sonst 403 mit sprechendem Fehler
  - Initialer Status: `registered` (ladv/competition) / `yes` (training/social)
- `PATCH /api/registrations/[id]` — Status oder Notiz ändern. Status-Validierung per Event-Typ (State Machine aus `03-feature-spec.md`). Auth: nur eigene Anmeldung.
- `POST /api/registrations/[id]/disciplines` — Disziplin hinzufügen (nur eigene, nur vor Fristablauf). Auth: nur eigene Anmeldung.
- `DELETE /api/registrations/[id]/disciplines/[disciplineId]` — Disziplin entfernen. Mindestens eine muss verbleiben. Auth: nur eigene Anmeldung.
- `GET /api/me/registrations` — alle eigenen Anmeldungen über alle Events.

**Frontend:**
- Event-Detailseite (`/events/[id]`) erweitern:
  - Anmeldeformular (wenn noch nicht angemeldet): bei LADV Disziplin-Auswahl aus `ladv_data.wettbewerbe`, bei competition/training/social Notiz-Feld. Hinweis "Öffentliche Notiz — für alle Mitglieder sichtbar".
  - Eigene Anmeldung bearbeiten: Status-Buttons gemäß State Machine, Disziplin hinzufügen/entfernen, Notiz editieren
  - Hinweis wenn Disziplin bereits `ladv_registered_at` gesetzt hat
  - F-22: Fehlermeldung bei fehlendem Startpass
- `/profil` — eigene Anmeldungsübersicht: Event-Name, Datum, Typ, Status, LADV-Status (bei ladv-Events), Link zur Detailseite

**Output:** Anmeldungs-Flow vollständig, `/profil` nutzbar  
**Kontext-Files:** `03-feature-spec.md` (F-03, F-04, F-06, F-22), `02b-datenmodell-entwurf.md` (ADR-005, ADR-007)

---

### 9.9 — Admin-Workflows: LADV-Protokollierung + Dashboard (F-12 admin, F-13, F-14, F-24)

**Ziel:** Kevin kann LADV-Anmeldungen und Abmeldungen protokollieren. Admin-Dashboard zeigt Events mit Handlungsbedarf.

**Was zu tun ist:**

**Backend:**
- `POST /api/registrations/[id]/disciplines/[disciplineId]/ladv-register` — `ladv_registered_at` + `ladv_registered_by` setzen. Nur wenn `registration.status = 'registered'` und `ladv_registered_at` noch nicht gesetzt. Auth: `requireAdmin()`.
- `POST /api/registrations/[id]/disciplines/[disciplineId]/ladv-cancel` — `ladv_canceled_at` + `ladv_canceled_by` setzen. Nur wenn `ladv_registered_at` gesetzt. Auth: `requireAdmin()`.

**Frontend:**
- Event-Detailseite (`/events/[id]`) erweitern (admin-only):
  - LADV-Operationsstatus aller Angemeldeten: "Noch nicht gemeldet" / "Angemeldet am [Datum] von [Coach]" / "Abgemeldet am [Datum]"
  - Protokollier-Buttons pro Disziplin (mit Coach-Name-Feld, vorbelegt mit Session-Name)
  - Filterbar nach Anmeldestatus
- `/admin` — Dashboard: Events mit offenem Handlungsbedarf (Anmeldungen ohne LADV-Status vor ablaufender Frist), Übersicht
- `/superuser` — Systemseite: "Campai-Sync anstoßen"-Button, Feedback nach Sync (Anzahl sync'd Members). Auth: `requireSuperuser()`.

**Output:** Admin-Workflows vollständig, Dashboard + Superuser-Seite nutzbar  
**Kontext-Files:** `03-feature-spec.md` (F-12, F-13, F-14, F-24), `02b-datenmodell-entwurf.md` (ADR-005, ADR-007)

---

### 9.10 — Kommentare (F-15, F-16)

**Ziel:** Admins können Announcements hinterlegen, Mitglieder können kommentieren.

**Was zu tun ist:**

**Backend:**
- `POST /api/events/[id]/comments` — Kommentar oder Announcement anlegen. `type = 'announcement'` nur für Admins erlaubt.
- `PATCH /api/comments/[id]` — Eigene Kommentare editieren; Admins können alle editieren.
- `DELETE /api/comments/[id]` — Eigene Kommentare löschen; Admins können alle löschen.

**Frontend:**
- Event-Detailseite (`/events/[id]`) — Kommentar-Bereich:
  - Announcements gepinnt oben, visuell klar abgesetzt
  - Kommentare darunter chronologisch
  - Formular: Kommentar schreiben (alle Mitglieder); Announcement-Formular (admin-only)
  - Edit/Delete-Buttons an eigenen Kommentaren

**Output:** Kommentar-System vollständig  
**Kontext-Files:** `03-feature-spec.md` (F-15, F-16), `02b-datenmodell-entwurf.md` (ADR-006)

---

### 9.11 — E-Mail-System (F-18, F-19)

**Setzt voraus:** Schritt 5 (E-Mail-Inventar) abgeschlossen + Kevin-Review.

**Ziel:** Alle synchronen E-Mails implementiert, jede Mail geloggt.

**Was zu tun ist:**

1. `sent_emails`-Logging-Infrastruktur in den Email-Service integrieren (nach jedem Versandversuch schreiben)

2. Vue-E-Mail-Templates in `app/emails/` für alle Must-Trigger:
   - `RegistrationConfirmation.vue` (E-01)
   - `RegistrationCancellation.vue` (E-02)
   - `LadvRegistered.vue` (E-03)
   - `LadvCanceled.vue` (E-04)
   - `UrgentRegistration.vue` (E-05, an Admins)

3. E-Mail-Trigger in API-Handler verdrahten:
   - `POST /api/events/[id]/registrations` → E-01 (+ E-05 wenn < 3 Tage vor Frist)
   - `PATCH /api/registrations/[id]` → E-02 (wenn `status = 'canceled'`)
   - LADV-Register → E-03
   - LADV-Cancel → E-04

4. Fehlerbehandlung: fachliche Aktion läuft durch auch bei Mail-Fehler, Fehler wird in `sent_emails.error` geloggt.

**Output:** Alle Must-E-Mails verschickt und geloggt  
**Kontext-Files:** `server/email/service.ts`, `planning/05-email-inventar.md`, `03-feature-spec.md` (F-18, F-19, E-Mail-Trigger-Matrix)

---

## Feature-Coverage-Überblick

| Feature | Session |
|---------|---------|
| F-01 Event-Liste | 9.5 |
| F-02 Event-Detail | 9.6 |
| F-03 Anmeldung | 9.8 |
| F-04 Anmeldung bearbeiten | 9.8 |
| F-06 Profil / Anmeldungsübersicht | 9.8 |
| F-07 Event manuell anlegen | 9.5 |
| F-08 LADV-Import | 9.5 |
| F-09 Event bearbeiten | 9.7 |
| F-10 LADV-Sync + Diff | 9.7 |
| F-11 Event absagen | 9.7 |
| F-12 Anmeldungen einsehen (member) | 9.8 |
| F-12 Anmeldungen einsehen (admin) | 9.9 |
| F-13 LADV-Anmeldung protokollieren | 9.9 |
| F-14 LADV-Abmeldung protokollieren | 9.9 |
| F-15 Admin-Announcement | 9.10 |
| F-16 Kommentare | 9.10 |
| F-18 Synchrone E-Mails | 9.11 |
| F-19 E-Mail-Log | 9.11 |
| F-21 Campai-Sync | ✅ bereits implementiert |
| F-22 LADV-Startpass | 9.8 |
| F-24 Superuser-Seite | 9.9 |
| F-25 Dev-Seeding | 9.4 |
