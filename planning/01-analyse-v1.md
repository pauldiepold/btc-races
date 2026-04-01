# Schritt 1 — Analyse der alten App (`btc-races-v1`)

## Stack (v1)

| Bereich       | Technologie                             |
|---------------|-----------------------------------------|
| Frontend      | Nuxt 3, Vue 3, Nuxt UI                  |
| Datenbank     | Supabase (PostgreSQL), Row Level Security |
| Auth          | Microsoft Entra ID (nur Admins); öffentliches Anmelden ohne Account |
| E-Mail        | Azure Communication Services            |
| Hosting       | Vercel                                  |
| Import        | Excel-Import für Mitglieder             |

---

## Datenbankschema (vollständig rekonstruiert)

### `competitions`
| Spalte               | Typ       | Beschreibung                              |
|----------------------|-----------|-------------------------------------------|
| id                   | bigint PK |                                           |
| name                 | text      |                                           |
| location             | text      |                                           |
| description          | text      |                                           |
| date                 | date      |                                           |
| registration_deadline| date      |                                           |
| announcement_link    | text      | Link zur Ausschreibung                    |
| registration_type    | enum      | INDEPENDENT / LADV / CLUB                 |
| race_type            | enum      | TRACK / ROAD                              |
| championship_type    | enum      | NO_CHAMPIONSHIP / BBM / NDM / DM          |
| veranstalter         | text      | Von LADV                                  |
| ausrichter           | text      | Von LADV                                  |
| sportstaette         | text      | Von LADV                                  |
| ladv_description     | text      | Von LADV                                  |
| ladv_data            | jsonb     | Rohdaten aus LADV-API                     |
| ladv_id              | integer   | LADV-Veranstaltungs-ID                    |
| ladv_last_sync       | timestamptz | Letzter LADV-Sync                       |
| created_by           | uuid FK   | → auth.users (Admin)                      |
| created_at / updated_at | timestamptz |                                      |

### `members`
| Spalte              | Typ       | Beschreibung                              |
|---------------------|-----------|-------------------------------------------|
| id                  | bigint PK |                                           |
| name                | text      | Vollständiger Name (kein firstName/lastName) |
| has_left            | boolean   | Hat den Verein verlassen                  |
| has_ladv_startpass  | boolean   | Besitzt LADV-Startpass                    |
| created_at / updated_at | timestamptz |                                      |

### `emails`
| Spalte    | Typ       | Beschreibung                              |
|-----------|-----------|-------------------------------------------|
| id        | bigint PK |                                           |
| email     | text UNIQUE |                                         |
| member_id | bigint FK | → members (1:1, auch UNIQUE)              |

> **Hinweis:** E-Mail und Member sind in v1 getrennte Tabellen. In v2 ist E-Mail direkt im `users`-Record.

### `registrations`
| Spalte              | Typ       | Beschreibung                                          |
|---------------------|-----------|-------------------------------------------------------|
| id                  | bigint PK |                                                       |
| member_id           | bigint FK | → members                                             |
| competition_id      | bigint FK | → competitions                                        |
| status              | enum      | pending / confirmed / canceled / pending_cancellation |
| notes               | text      | Freitext-Notiz des Mitglieds                          |
| ladv_registered_at  | timestamptz | Zeitpunkt LADV-Meldung durch Coach                  |
| ladv_registered_by  | text      | Name des Coaches (LADV-Meldung)                       |
| ladv_canceled_at    | timestamptz | Zeitpunkt LADV-Abmeldung durch Coach                |
| ladv_canceled_by    | text      | Name des Coaches (LADV-Abmeldung)                     |
| created_at / updated_at | timestamptz |                                                   |
| UNIQUE              |           | (member_id, competition_id)                           |

### `competition_distances`
| Spalte         | Typ       | Beschreibung                              |
|----------------|-----------|-------------------------------------------|
| id             | bigint PK |                                           |
| competition_id | bigint FK | → competitions                            |
| distance       | text      | z.B. "100m", "Weitsprung"                 |

> **Status:** Tabelle angelegt, in v1 nie verwendet.

### `sent_emails`
| Spalte           | Typ       | Beschreibung                              |
|------------------|-----------|-------------------------------------------|
| id               | bigint PK |                                           |
| registration_id  | bigint FK | → registrations                           |
| email_type       | text      | Art der E-Mail (z.B. "confirmation")      |
| subject          | text      |                                           |
| token            | text      | Bestätigungs-/Abmeldetoken                |
| token_expires_at | timestamptz |                                         |
| token_verified_at| timestamptz |                                         |
| status           | text      | pending / sent / error                    |
| sent_at          | timestamptz |                                         |
| error            | text      |                                           |
| retry_count      | integer   |                                           |
| recipients       | jsonb     | Liste der Empfänger                       |

---

## Feature-Bestand

### Authentifizierung
- [x] Microsoft Entra ID für Admins (Login via Microsoft-Account)
- [x] Öffentliche Anmeldung ohne Account (nur E-Mail-Eingabe)
- [ ] Magic-Link / Passwordless für alle User → **neu in v2**

### Wettkämpfe (öffentlich)
- [x] Wettkampfliste mit Filter (Track/Road, Meisterschaft, meldepflichtig)
- [x] Wettkampfdetailseite (inkl. Anzahl Angemeldeter)
- [x] Anmeldeformular (E-Mail-Eingabe, Notiz, Startpass-Prüfung)
- [x] Sperre bei abgelaufener Anmeldefrist
- [x] Sperre bei fehlendem LADV-Startpass (meldepflichtige Wettkämpfe)

### Anmeldungen (öffentlich / per E-Mail-Link)
- [x] Anmeldung erstellen (Status: `pending`)
- [x] Anmeldung bestätigen per E-Mail-Link (Status: `confirmed`)
- [x] Abmeldung per E-Mail-Link (Status: `canceled`)

### Wettkämpfe (Admin)
- [x] Wettkampf manuell anlegen
- [x] Wettkampf bearbeiten
- [x] Wettkampf aus LADV importieren (per LADV-ID)
- [x] LADV-Sync (Wettkampfdaten aktualisieren)

### LADV-Status (Admin)
- [x] Teilnehmer bei LADV anmelden (protokolliert Coach-Name + Zeitpunkt)
- [x] Teilnehmer bei LADV abmelden (protokolliert Coach-Name + Zeitpunkt)

### Mitglieder (Admin)
- [x] Mitglieder-Import via Excel
- [x] LADV-Startpass-Status verwalten
- [ ] Campai-API-Sync → **neu in v2 (ersetzt Excel-Import)**

### E-Mail-Benachrichtigungen (synchron)
| E-Mail                          | Auslöser                            | Empfänger      |
|---------------------------------|-------------------------------------|----------------|
| Anmeldebestätigung (pending)    | Anmeldung erstellt                  | Teilnehmer     |
| Bestätigungsdetails (confirmed) | Anmeldung bestätigt                 | Teilnehmer     |
| Abmeldebestätigung              | Abmeldung                           | Teilnehmer     |
| LADV-Anmeldung durch Coach      | Coach meldet bei LADV an            | Teilnehmer     |
| LADV-Abmeldung durch Coach      | Coach meldet bei LADV ab            | Teilnehmer     |
| Dringende Anmeldung             | Anmeldung < 3 Tage vor Meldefrist   | Alle Coaches   |

### E-Mail-Benachrichtigungen (asynchron / Cronjob) — **NICHT implementiert**
- [ ] 5 Tage vor Meldefrist: Nachfrage bei Teilnehmern mit Abmeldelink
- [ ] 3 Tage vor Meldefrist: Erinnerung an Coaches
- [ ] 2 Tage vor Wettkampf: Info an Teilnehmer
- [ ] 3 Tage nach Anmeldung ohne Bestätigung: Nachfrage an Teilnehmer

### Nicht implementiert / nur geplant
- [ ] Disziplinen und Altersklassen bei Anmeldung (Tabelle angelegt, nie genutzt)
- [ ] Captcha für öffentliche Formulare
- [ ] Admin: Nachrichten an alle Teilnehmer senden
- [ ] Light-Mode

---

## Wesentliche Unterschiede v1 → v2

| Aspekt              | v1                              | v2                                    |
|---------------------|---------------------------------|---------------------------------------|
| Auth                | Microsoft Entra (nur Admins)    | Magic-Link für alle eingeloggten User |
| User-Modell         | `members` + `emails` getrennt   | `users` mit firstName/lastName/email  |
| Mitglieder-Import   | Excel manuell                   | Campai-API-Sync (automatisch)         |
| Datenbank           | Supabase PostgreSQL + RLS       | Cloudflare D1 (SQLite) via NuxtHub    |
| Hosting             | Vercel                          | Cloudflare Pages                      |

---

## Offene Fragen

1. **Auth-Modell in v2:** Magic-Link gilt für alle Mitglieder — bedeutet das, dass sich jedes Mitglied einloggen und *seine eigenen* Anmeldungen verwalten kann? Oder ist der Anmeldeflow weiterhin anonym (nur E-Mail-Eingabe)?

2. **Öffentlicher Anmelde-Flow:** In v1 konnte sich jeder mit einer beliebigen E-Mail-Adresse anmelden (keine Prüfung ob Mitglied). In v2 prüft `/api/auth/login`, ob die E-Mail in der `users`-Tabelle existiert — wie soll damit umgegangen werden?

3. **Disziplinen / Altersklassen:** War in v1 nie implementiert — soll das in v2 kommen? Wenn ja: LADV-Disziplincodes verwenden?

4. **competition_distances:** Tabelle war in v1 angelegt aber nie genutzt — wird sie in v2 verwendet (z.B. für Disziplinen-Auswahl bei Anmeldung)?

5. **LADV-Meldung durch Kevin:** Wie erfolgt die LADV-Meldung konkret? Über das Admin-Interface der App, oder Kevin trägt die Daten direkt bei LADV ein und markiert es nur in der App?

6. **Anmeldung mit Notiz:** Das Notiz-Feld (`notes`) bei der Anmeldung — wird das aktiv genutzt? Soll es bleiben?

7. **Asynchrone E-Mails:** Sollen die Erinnerungs-Mails (5 Tage vor Meldefrist etc.) in v2 umgesetzt werden?

8. **Admin-Zugang:** Wer soll Admin sein? Nur Kevin, oder mehrere Personen? Wie wird die Rolle vergeben?
