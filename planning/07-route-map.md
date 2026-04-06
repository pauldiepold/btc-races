# Route Map / API Surface

_Stand: 2026-04-02_

---

## Konventionen

- **Frontend-URLs:** Deutsch (Ausnahme: `events` ist bereits eingedeutschter Begriff)
- **API-Endpunkte:** Englisch
- **Auth-Kürzel:** `—` = public, `member` = eingeloggtes Mitglied, `admin` = role admin oder superuser, `superuser` = role superuser, `cron` = Bearer-Token
- ✅ = bereits implementiert

---

## Frontend Pages

| Route | Seite | Zugriff | Feature |
|-------|-------|---------|---------|
| `/` | Landing / Startseite | — | — |
| `/login` | Magic-Link Login | — | ✅ Auth |
| `/link-gesendet` | Bestätigung nach Login-Anfrage | — | ✅ Auth |
| `/verify` | Token-Verifizierung (Server Route) | — | ✅ Auth |
| `/events` | Event-Liste | member | F-01 |
| `/events/[id]` | Event-Detailseite inkl. Anmeldeformular, Teilnehmerliste, Kommentare | member | F-02, F-03, F-04, F-12, F-15, F-16 |
| `/events/[id]/bearbeiten` | Event bearbeiten | member (nur Ersteller) + admin | F-09 |
| `/events/neu` | Neues Event manuell anlegen | member | F-07 |
| `/events/ladv-importieren` | LADV-Event via Ausschreibungslink importieren | member | F-08 |
| `/profil` | Eigene Anmeldungsübersicht | member | F-06 |
| `/admin` | Admin-Dashboard (Events mit offenen LADV-Aktionen, Übersicht) | admin | F-12 |
| `/superuser` | Superuser-Systemseite (Campai-Sync manuell) | superuser | F-24 |

### Anmerkungen

- **`/events/[id]`** ist die zentrale Seite — sie rendert je nach Rolle unterschiedliche Inhalte:
  - Mitglied: Anmeldeformular/-status, Teilnehmerliste (ohne LADV-Status anderer), Kommentare
  - Admin/Superuser: zusätzlich LADV-Operationsstatus aller Angemeldeten, Aktions-Buttons für LADV-Protokollierung, Announcement-Formular, Sync-Button (bei LADV-Events)
- **`/events/[id]/bearbeiten`** ist zugänglich für: Admin (alle Events) + Ersteller (`created_by = session.id`)
- **`/admin`** zeigt primär Events mit Handlungsbedarf (Anmeldungen ohne LADV-Status, bald ablaufende Fristen)

---

## API-Endpunkte

### Auth

| Methode | Pfad | Zugriff | Beschreibung | Feature |
|---------|------|---------|--------------|---------|
| `POST` | `/api/auth/login` | — | Magic-Link anfordern | ✅ |
| `POST` | `/api/auth/logout` | member | Session löschen | ✅ |
| `GET` | `/verify` | — | Token validieren, Session setzen | ✅ (Server Route) |

### Events

| Methode | Pfad | Zugriff | Beschreibung | Feature |
|---------|------|---------|--------------|---------|
| `GET` | `/api/events` | member | Event-Liste (mit Filtern: type, timeRange) | ✅ (partial) |
| `POST` | `/api/events` | member | Neues Event anlegen (`competition`, `training`, `social`) | F-07 |
| `POST` | `/api/events/ladv-import` | member | LADV-Event via Ausschreibungslink importieren | F-08 |
| `GET` | `/api/events/[id]` | member | Event-Details inkl. Anmeldungen + Kommentare | F-02 |
| `PATCH` | `/api/events/[id]` | admin + Ersteller | Event bearbeiten | F-09 |
| `POST` | `/api/events/[id]/cancel` | admin | Event absagen (`cancelled_at` setzen) | F-11 |
| `POST` | `/api/events/[id]/sync` | admin | LADV-Daten aktualisieren (`ladv_data`, `ladv_last_sync`) | F-10 |

### Registrations

| Methode | Pfad | Zugriff | Beschreibung | Feature |
|---------|------|---------|--------------|---------|
| `POST` | `/api/events/[id]/registrations` | member | Neu anmelden | F-03 |
| `PATCH` | `/api/registrations/[id]` | member (eigene) | Status oder Notiz ändern | F-04 |

### Registration Disciplines (LADV)

| Methode | Pfad | Zugriff | Beschreibung | Feature |
|---------|------|---------|--------------|---------|
| `POST` | `/api/registrations/[id]/disciplines` | member (eigene) | Disziplin hinzufügen | F-04 |
| `DELETE` | `/api/registrations/[id]/disciplines/[disciplineId]` | member (eigene) | Disziplin entfernen | F-04 |
| `POST` | `/api/registrations/[id]/ladv-register` | admin | LADV-Anmeldung für alle Disziplinen der Anmeldung protokollieren | F-13 |
| `POST` | `/api/registrations/[id]/ladv-cancel` | admin | LADV-Abmeldung für alle Disziplinen der Anmeldung protokollieren | F-14 |

### Comments

| Methode | Pfad | Zugriff | Beschreibung | Feature |
|---------|------|---------|--------------|---------|
| `POST` | `/api/events/[id]/comments` | member (comment) / admin (announcement) | Kommentar oder Announcement anlegen | F-15, F-16 |
| `PATCH` | `/api/comments/[id]` | member (eigene) / admin (alle) | Kommentar bearbeiten | F-15, F-16 |
| `DELETE` | `/api/comments/[id]` | member (eigene) / admin (alle) | Kommentar löschen | F-15, F-16 |

### Profil / eigene Daten

| Methode | Pfad | Zugriff | Beschreibung | Feature |
|---------|------|---------|--------------|---------|
| `GET` | `/api/me/registrations` | member | Eigene Anmeldungen (alle Events, inkl. vergangene) | F-06 |

### Cron / System

| Methode | Pfad | Zugriff | Beschreibung | Feature |
|---------|------|---------|--------------|---------|
| `POST` | `/api/cron/sync-members` | cron + superuser | Campai-Mitgliedersync | ✅ F-21, F-24 |
| `POST` | `/api/cron/send-reminders` | cron | Erinnerungs-Mails (täglich) | F-20 `[Backlog]` |

---

## Nitro Tasks

| Task | Beschreibung | Auslöser | Feature |
|------|--------------|----------|---------|
| `tasks/sync-members` | Campai-Sync-Logik | Via `runTask()` aus `/api/cron/sync-members` | ✅ F-21 |
| `tasks/seed` | Testdaten (dev only) | Manuell | — |
| `tasks/send-reminders` | Reminder-Mail-Versand | Via `/api/cron/send-reminders` | F-20 `[Backlog]` |

---

## Middleware

| Middleware | Typ | Beschreibung |
|------------|-----|--------------|
| `app/middleware/auth.global.ts` | Client (global) | Session-Pflicht für alle Routen außer `/login` + `/link-gesendet`; Rollen-Redirect für `/admin` (→ admin/superuser) und `/superuser` (→ superuser) |
| `server/middleware/auth.ts` | Server | Session-Pflicht für `/api/events`, `/api/registrations`, `/api/comments`, `/api/me` |

---

## Rollen-Zuweisung

Rollen werden ausschließlich beim Campai-Sync (`server/tasks/sync-members.ts`) gesetzt — nie manuell.

| Rolle | Bedingung |
|-------|-----------|
| `superuser` | E-Mail `paul@diepold.de` (hartcodiert) |
| `admin` | Campai-Section `"Coaches"` |
| `member` | alle anderen aktiven Mitglieder |

**Priorität:** superuser > admin > member (wird in dieser Reihenfolge geprüft).

Server-seitige Guards liegen in `server/utils/auth.ts`:
- `requireAdmin(event)` — admin oder superuser
- `requireSuperuser(event)` — nur superuser
- `requireOwnerOrAdmin(event, ownerId)` — eigener Datensatz oder admin/superuser
