# BTC Wettkampfanmeldung v2 — Feature Spec

_Stand: 2026-03-31_

---

## Inhalt

1. [Scope & Rollen](#scope--rollen)
2. [Feature Catalog](#feature-catalog)
3. [Status-Modell](#status-modell)
4. [E-Mail-Trigger-Matrix](#e-mail-trigger-matrix)
5. [Offene Entscheidungen](#offene-entscheidungen)
6. [Kevin-Briefing](#kevin-briefing)

---

## Scope & Rollen

**Was die App macht:** Vereinsmitglieder des Berlin Track Club melden sich zu Wettkämpfen, Trainings und Vereinsevents an. Admins verwalten Events und pflegen den LADV-Meldestatus nach.

**Was die App ausdrücklich nicht macht:** Direkte LADV-API-Schreibzugriffe. Die eigentliche Anmeldung auf der LADV-Website bleibt manueller Schritt durch Kevin/Admins — die App protokolliert nur, wann das passiert ist.

### Rollen

| Rolle  | Beschreibung                                                          | Anzahl |
|--------|-----------------------------------------------------------------------|--------|
| Mitglied | Eingeloggtes BTC-Mitglied, kann sich anmelden und Events anlegen   | ~100+  |
| Admin  | Kevin + Vereinsverantwortliche, verwalten Events und LADV-Workflow   | ~10    |
| System | Automatische Prozesse (Campai-Sync, E-Mail-Cronjobs, Push)          | —      |

Admins sind reguläre User mit `role = 'admin'` in der `users`-Tabelle. Die Verwaltung der Admin-Rolle erfolgt in v2 direkt in der DB (kein Admin-UI dafür vorgesehen, bei ~10 Personen vertretbar).

### Event-Typen im Überblick

| Typ          | Beschreibung                                             | Meldefrist | LADV-Workflow |
|--------------|----------------------------------------------------------|------------|---------------|
| `ladv`       | Wettkampf aus LADV-Datenbank, mit Disziplin-/AK-Wahl    | Ja         | Ja            |
| `competition`| Manuell angelegter Wettkampf                             | Ja         | Nein          |
| `training`   | Training — Ja/Nein/Vielleicht, kein Bestätigungsschritt | Nein       | Nein          |
| `social`     | Vereinsevent / Teamevent — verhält sich wie `training`   | Nein       | Nein          |

### Prioritäten (MoSCoW)

| Priorität  | Bedeutung                                                  |
|------------|------------------------------------------------------------|
| **Must**   | Ohne das ist die App nicht sinnvoll nutzbar               |
| **Should** | Wichtig, aber kurzfristig existiert ein Workaround       |
| **Could**  | Nice to have, wenn Zeit bleibt                            |
| **Won't**  | Bewusst nicht in v2 — für später oder nie                 |

---

## Feature Catalog

### Bereits implementiert (kein Entwicklungsaufwand)

| Feature                                      | Status           |
|----------------------------------------------|------------------|
| Magic-Link Auth (Login / Verify / Logout)    | ✅ Implementiert  |
| Campai-Sync (Mitglieder-Sync)                | ✅ Implementiert  |
| User-Session-Handling                        | ✅ Implementiert  |

---

### Domain: Events — Alle Mitglieder

---

#### F-01: Event-Liste

**Priorität:** Must

**Beschreibung:** Mitglied sieht alle kommenden Events in einer Listenansicht.

**Akzeptanzkriterien:**
- Events sind standardmäßig nach Datum aufsteigend sortiert (nächstes zuerst)
- Filterbar nach Typ (`ladv`, `competition`, `training`, `social`) und Zeitraum
- Pro Event sichtbar: Name, Datum, Ort, Typ-Badge, Meldefrist (falls gesetzt), eigener Anmeldestatus
- Abgesagte Events (`cancelled_at IS NOT NULL`) werden angezeigt, aber als "Abgesagt" markiert — nicht ausgeblendet
- Vergangene Events standardmäßig ausgeblendet, über Filter einblendbar

**Abhängigkeiten:** Auth (bereits implementiert)

---

#### F-02: Event-Detailseite

**Priorität:** Must

**Beschreibung:** Vollständige Informationsseite zu einem Event mit allen relevanten Daten.

**Akzeptanzkriterien:**
- Alle normalisierten Felder sichtbar: Name, Datum, Ort, Meldefrist, Ausschreibungslink
- Bei LADV-Events: zusätzlich Metadaten aus `ladv_data` (Veranstalter, Ausrichter, Sportstätte, Wettkampfbeschreibung)
- Anmeldeformular eingebunden (oder Statusanzeige wenn bereits angemeldet) — siehe F-03
- Teilnehmerliste mit Anmeldestatus für alle eingeloggten Mitglieder sichtbar (inkl. Status-Badge: angemeldet, vielleicht, abgesagt)
- Kommentare und Announcements angezeigt; Announcements gepinnt oben — siehe F-16, F-15
- Abgesagtes Event zeigt deutlichen Hinweis, Anmeldebutton gesperrt

**Abhängigkeiten:** F-01, F-03, F-15, F-16

---

#### F-03: Event-Anmeldung

**Priorität:** Must

**Beschreibung:** Mitglied meldet sich zu einem Event an.

**Akzeptanzkriterien:**
- Bei `ladv`-Events: Disziplin + Altersklasse aus der `wettbewerbe`-Liste in `ladv_data` als Dropdown wählbar, beide Felder required
- Bei `competition`-Events: nur optionales Notiz-Feld
- Bei `training`- und `social`-Events: nur optionales Notiz-Feld; initialer Status ist `yes` (nicht `registered`)
- Anmeldung nach abgelaufener Meldefrist gesperrt (bei `ladv` + `competition`); `training` und `social` haben keine Frist
- Anmeldung bei abgesagtem Event gesperrt
- Nach Anmeldung: E-Mail-Bestätigung an Mitglied (→ E-01)
- Bei Anmeldung weniger als 3 Tage vor Meldefrist: E-Mail an alle Admins (→ E-05)
- Doppelte Anmeldung nicht möglich (UNIQUE constraint `event_id + user_id`)

**Abhängigkeiten:** F-02

---

#### F-04: Anmeldung stornieren

**Priorität:** Must

**Beschreibung:** Mitglied kann seine eigene aktive Anmeldung stornieren.

**Akzeptanzkriterien:**
- Nur möglich wenn Status nicht bereits `canceled` oder `no`
- Status wird auf `canceled` (bei `ladv`/`competition`) bzw. `no` (bei `training`/`social`) gesetzt
- Bei `ladv`-Events mit bereits gesetztem `ladv_registered_at` (d.h. Kevin hat die Person schon bei LADV angemeldet): sichtbarer Hinweis dass Kevin die LADV-Abmeldung noch manuell nachpflegen muss
- Nach Stornierung: E-Mail-Bestätigung an Mitglied (→ E-02)
- Stornierung bleibt auch nach abgelaufener Meldefrist möglich — Admin entscheidet dann selbst über die LADV-Abmeldung

**Abhängigkeiten:** F-03

---

#### F-05: "Vielleicht"-Interesse signalisieren

**Priorität:** Should

**Beschreibung:** Für `competition`, `training` und `social`: Mitglied signalisiert unverbindliches Interesse.

**Akzeptanzkriterien:**
- Status `maybe` ist bei `competition`, `training` und `social` wählbar, **nicht** bei `ladv`
- Wechsel zwischen `maybe`, `registered`/`yes` und `canceled`/`no` jederzeit möglich (bei `competition` vor Meldefrist)
- `maybe`-Anmeldungen erscheinen in der Teilnehmerliste mit eigenem Badge
- Keine E-Mail bei `maybe`-Status (kein Trigger)

**Abhängigkeiten:** F-03

---

#### F-06: Eigene Anmeldungsübersicht

**Priorität:** Should

**Beschreibung:** Mitglied hat eine Übersicht aller eigenen Anmeldungen.

**Akzeptanzkriterien:**
- Eigene Seite oder Profil-Tab mit allen eigenen Anmeldungen
- Sortierung nach Datum, neueste zuerst
- Zeigt: Event-Name, Datum, Typ, eigener Status, LADV-Status (bei `ladv`-Events: ob bei LADV angemeldet)
- Direktlink zur Event-Detailseite

**Abhängigkeiten:** F-03

---

#### F-07: Event manuell anlegen

**Priorität:** Must

**Beschreibung:** Jedes eingeloggte Mitglied legt einen neuen `competition`-, `training`- oder `social`-Event an.

**Akzeptanzkriterien:**
- Pflichtfelder: Name, Datum, Typ (`competition`, `training` oder `social`)
- Optionale Felder: Ort, Meldefrist (nur bei `competition`), Ausschreibungslink
- Typ `ladv` ist über dieses Formular nicht anlegbar (nur via F-08)
- Event ist nach Anlegen sofort für alle Mitglieder sichtbar
- `created_by` wird mit der User-ID des anliegenden Mitglieds gesetzt
- Ersteller kann das eigene Event nachträglich bearbeiten; Admins können alle Events bearbeiten (→ F-09)

**Abhängigkeiten:** —

---

#### F-08: Event aus LADV importieren

**Priorität:** Must

**Beschreibung:** Jedes eingeloggte Mitglied importiert einen LADV-Wettkampf via Ausschreibungslink.

**Akzeptanzkriterien:**
- Mitglied gibt den Ausschreibungslink (LADV-URL) ein — die LADV-ID wird automatisch daraus geparst
- LADV-API-Aufruf befüllt alle normalisierten Felder (`name`, `date`, `location`, `registration_deadline`, `announcement_link`)
- Vollständige Rohdaten werden in `ladv_data` gespeichert, `ladv_last_sync` wird gesetzt
- Duplikat-Check: wenn `ladv_id` bereits in der DB existiert, Hinweis mit Link zum bestehenden Event
- Nach erfolgreichem Import: direkte Weiterleitung zur Event-Detailseite
- `created_by` wird mit der User-ID des importierenden Mitglieds gesetzt
- Ersteller kann das eigene Event nachträglich bearbeiten; Admins können alle Events bearbeiten (→ F-09)

**Abhängigkeiten:** —

---

### Domain: Events — Admin

---

#### F-09: Event bearbeiten

**Priorität:** Must

**Beschreibung:** Admins können alle Events bearbeiten; Ersteller können ihr eigenes Event bearbeiten.

**Akzeptanzkriterien:**
- Editierbare Felder: Name, Datum, Ort, Meldefrist, Ausschreibungslink
- Manuelle Änderungen überstehen spätere LADV-Syncs (Sync schreibt nur `ladv_data` + `ladv_last_sync`, nicht normalisierte Felder — ADR-003)
- Bei LADV-Events: wenn editierte Felder von den Werten in `ladv_data` abweichen, wird ein visueller Diff-Hinweis angezeigt (→ F-10)
- Typ-Änderung nach dem Anlegen nicht möglich
- Zugriff: Admin (alle Events) oder Ersteller (nur eigene Events, `created_by = session.id`)

**Abhängigkeiten:** F-07, F-08

---

#### F-10: LADV-Sync + Diff-Hinweis

**Priorität:** Must (Sync) / Should (Diff-Hinweis)

**Beschreibung:** Admin aktualisiert LADV-Daten manuell. Frontend zeigt, wenn sich LADV-Quelldaten von den normalisierten Feldern unterscheiden.

**Akzeptanzkriterien:**
- "Sync"-Button auf der Detailseite eines LADV-Events
- Sync aktualisiert `ladv_data` + `ladv_last_sync`; normalisierte Felder werden nicht überschrieben
- Wenn LADV-Daten `abgesagt: true` enthalten: `cancelled_at` wird gesetzt. Keine automatische Mail an Athleten — Admin entscheidet (→ OE-4)
- **Diff-Hinweis (Should):** wenn `name`, `date`, `location` oder `registration_deadline` in `ladv_data` von den gespeicherten Werten abweichen → sichtbarer Hinweis mit Option "Feld übernehmen" pro Feld
- Letzter Sync-Zeitpunkt (`ladv_last_sync`) auf der Eventseite sichtbar

**Abhängigkeiten:** F-09

---

#### F-11: Event absagen

**Priorität:** Should

**Beschreibung:** Admin markiert ein Event manuell als abgesagt.

**Akzeptanzkriterien:**
- Setzt `cancelled_at` auf den aktuellen Zeitpunkt
- Kein echtes Löschen — Event bleibt in der DB und in der UI sichtbar (mit "Abgesagt"-Badge)
- Bestehende Anmeldungen bleiben unverändert erhalten
- Ob eine automatische Massen-Mail an Angemeldete gesendet wird: → OE-4

**Abhängigkeiten:** F-07, F-08

---

#### F-12: Anmeldungen einsehen

**Priorität:** Must

**Beschreibung:** Admin sieht alle Anmeldungen zu einem Event.

**Akzeptanzkriterien:**
- Tabelle mit: Name des Mitglieds, Anmeldestatus, Disziplin + Altersklasse (bei `ladv`), Notiz, LADV-Operationsstatus
- LADV-Operationsstatus zeigt: "Noch nicht bei LADV gemeldet" / "Bei LADV angemeldet am [Datum] von [Coach]" / "Bei LADV abgemeldet am [Datum] von [Coach]"
- Filterbar nach Anmeldestatus
- CSV-Export oder mindestens copy-paste-freundliche Darstellung: **Could**

**Abhängigkeiten:** F-03

---

#### F-13: LADV-Anmeldung protokollieren

**Priorität:** Must

**Beschreibung:** Admin protokolliert, dass er einen Teilnehmer manuell auf der LADV-Website angemeldet hat.

**Akzeptanzkriterien:**
- Setzt `ladv_registered_at` (Zeitstempel) und `ladv_registered_by` (standardmäßig Name aus der Session, editierbar falls ein anderer Coach gemeldet hat)
- Aktion nur möglich wenn `registration.status = 'registered'`
- Aktion nur möglich wenn `ladv_registered_at` noch nicht gesetzt (kein versehentliches Überschreiben)
- Nach Protokollierung: E-Mail-Bestätigung an Teilnehmer (→ E-03)
- Wenn `ladv_registered_at` bereits gesetzt: nur Anzeige, kein Button

**Abhängigkeiten:** F-12

---

#### F-14: LADV-Abmeldung protokollieren

**Priorität:** Must

**Beschreibung:** Admin protokolliert, dass er einen Teilnehmer manuell auf der LADV-Website abgemeldet hat.

**Akzeptanzkriterien:**
- Setzt `ladv_canceled_at` + `ladv_canceled_by`
- Aktion nur möglich wenn `ladv_registered_at` gesetzt (man kann nur abmelden was angemeldet wurde)
- Nach Protokollierung: E-Mail-Bestätigung an Teilnehmer (→ E-04)

**Abhängigkeiten:** F-13

---

#### F-15: Admin-Announcement verfassen

**Priorität:** Should

**Beschreibung:** Admin heftet eine Ankündigung oder wichtige Information an ein Event.

**Akzeptanzkriterien:**
- Wird als `type = 'announcement'` in `event_comments` gespeichert, nur von Admins erstellbar
- Im Frontend oben gepinnt, visuell klar von Mitglieder-Kommentaren unterscheidbar
- Editierbar und löschbar durch Admins
- Kein E-Mail-Trigger — Mitglieder sehen es beim nächsten Besuch der Detailseite

**Abhängigkeiten:** F-02

---

### Domain: Kommentare — Mitglieder

---

#### F-16: Kommentar auf Event schreiben

**Priorität:** Could

**Beschreibung:** Jedes eingeloggte Mitglied kann einen Kommentar auf der Detailseite hinterlassen.

**Akzeptanzkriterien:**
- Wird als `type = 'comment'` in `event_comments` gespeichert
- Eigene Kommentare sind editierbar und löschbar
- Admins können jeden Kommentar löschen (Moderation)
- Kein E-Mail-Trigger

**Abhängigkeiten:** F-02

---

#### F-17: Emoji-Reaktionen auf Kommentare

**Priorität:** Won't (v2)

**Beschreibung:** Schema-seitig vorbereitet (`reactions`-Tabelle mit FK auf `event_comments.id`), kein UI in v2.

---

### Domain: E-Mail

---

#### F-18: Synchrone E-Mails

**Priorität:** Must

**Beschreibung:** E-Mails, die unmittelbar als Reaktion auf eine Benutzeraktion verschickt werden.

**Akzeptanzkriterien:**
- Versand im gleichen Request wie die auslösende Aktion
- Bei Versandfehler: die fachliche Aktion wird trotzdem durchgeführt, Fehler wird geloggt (in `sent_emails.error`)
- Jede versandte (und fehlgeschlagene) E-Mail wird in `sent_emails` protokolliert (→ F-19)

→ Details in der [E-Mail-Trigger-Matrix](#e-mail-trigger-matrix)

**Abhängigkeiten:** F-19

---

#### F-19: E-Mail-Log (`sent_emails`)

**Priorität:** Must

**Beschreibung:** Jede ausgehende E-Mail wird protokolliert, damit Support-Anfragen beantwortbar sind ("Hat X die LADV-Bestätigung bekommen?").

**Schema:**

| Spalte     | Typ                      | Beschreibung                              |
|------------|--------------------------|-------------------------------------------|
| id         | text PK                  | UUID                                      |
| event_id   | text FK → events.id      | nullable (bei nicht-event-bezogenen Mails)|
| user_id    | text FK → users.id       |                                           |
| type       | text NOT NULL            | Enum: `registration`, `cancellation`, `ladv_registered`, `ladv_canceled`, `urgent_registration`, `reminder_athlete`, `reminder_admin`, `event_reminder` |
| sent_at    | integer (timestamp)      | null wenn Versand fehlgeschlagen          |
| error      | text                     | Fehlermeldung falls Versand fehlschlug    |

**Akzeptanzkriterien:**
- Kein Mail-Body gespeichert (kein unnötiges DSGVO-Risiko, kein Speicheraufwand)
- Dient als Duplikat-Schutz für asynchrone Cronjob-Mails (F-20)
- Kein Admin-UI in v2 — direkte DB-Abfrage reicht für den seltenen Support-Fall

---

#### F-20: Asynchrone E-Mails / Cronjobs

**Priorität:** Could

**Beschreibung:** Zeitgesteuerte Erinnerungs-Mails, ausgelöst durch tägliche Cronjobs.

**Akzeptanzkriterien:**
- Cronjob läuft täglich
- Duplikat-Schutz: vor dem Versand prüfen ob `sent_emails`-Eintrag für `(user_id, event_id, type)` bereits existiert
- Einzelne Trigger konfigurierbar — welche tatsächlich aktiviert werden: → OE-2, Kevin-Input (→ F-K3)

→ Details in der [E-Mail-Trigger-Matrix](#e-mail-trigger-matrix)

**Abhängigkeiten:** F-19

---

### Domain: System

---

#### F-21: Campai-Sync

**Priorität:** Must — **bereits implementiert**

**Beschreibung:** Automatischer Abgleich aktiver Vereinsmitglieder aus Campai in die `users`-Tabelle.

**Status:** Implementiert. Auslösung via `POST /api/cron/sync-members` (Bearer-Token).

---

#### F-22: LADV-Startpass via Campai

**Priorität:** Offen — **Entscheidung ausstehend (→ OE-1, F-K1)**

**Beschreibung:** In v1 wurde `has_ladv_startpass` manuell gepflegt und blockierte die Anmeldung bei LADV-Events ohne Startpass. Das Feld soll in Campai vorhanden sein.

**Optionen:**

| Option | Beschreibung | Vorteil | Nachteil |
|--------|-------------|---------|----------|
| **A — Campai-Sync** | Feld bei Sync aus Campai übernehmen, Anmeldung ohne Startpass bei LADV-Events sperren | Selbstständige Prüfung, kein manueller Aufwand | Hängt von Datenqualität in Campai ab |
| **B — Weglassen** | Kevin prüft selbst beim LADV-Anmelden ob jemand einen Startpass hat | Kein Implementierungsaufwand | Fehlerpotenzial bei großen Gruppen |

**Abhängigkeiten:** F-21, F-03

---

#### F-23: Club-App Push-Integration

**Priorität:** Could

**Beschreibung:** Neue Events oder Anmeldungen können als Push-Meldung in die Vereins-App (Campai oder vergleichbare Club-App-API) übermittelt werden, damit Mitglieder dort direkt informiert werden.

**Konzept (noch offen — Stub):**
- Optionaler Webhook/API-Aufruf an die Vereins-App-API, ausgelöst durch definierbare Ereignisse
- Mögliche Trigger (noch zu entscheiden):
  - Neues Event angelegt (→ alle Mitglieder informieren)
  - Neue Anmeldung zu einem Event (→ Ersteller / Admins informieren)
- Direkt zugänglicher Link zurück in die BTC-Races-App (zur Event-Detailseite) wird mitgesendet
- Konfigurierbar welche Trigger aktiv sind (z.B. per Umgebungsvariable oder Admin-Setting)

**Akzeptanzkriterien (Stub-Scope für v2):**
- Service/Handler-Struktur ist angelegt und aufrufbar
- Tatsächliche API-Integration ist hinter einem Feature-Flag / Konfigurationsschalter — kein aktiver Versand in v2 ohne explizite Aktivierung
- Interface-Definition vorhanden, damit spätere Implementierung klar andocken kann

**Offene Fragen:** Welche Trigger sind sinnvoll? Unterstützt die Campai-API ausgehende Push-Meldungen oder gibt es eine alternative Club-App-API?

**Abhängigkeiten:** F-07, F-08

---

## Status-Modell

### Registrierungs-Status je Event-Typ

| Event-Typ     | Mögliche Werte                          | Steuerung |
|---------------|-----------------------------------------|-----------|
| `ladv`        | `registered` ↔ `canceled`              | Mitglied  |
| `competition` | `registered` ↔ `maybe` ↔ `canceled`   | Mitglied  |
| `training`    | `yes` ↔ `maybe` ↔ `no`                 | Mitglied  |
| `social`      | `yes` ↔ `maybe` ↔ `no`                 | Mitglied  |

**Hinweise:**
- Bei `ladv` kein `maybe` — LADV erfordert eine verbindliche Meldung
- `training` und `social` verhalten sich identisch: kein Admin-Bestätigungsschritt, keine Meldefrist, initialer Status `yes`
- Übergänge sind in alle Richtungen frei möglich, solange die Meldefrist nicht abgelaufen ist (bei `ladv` und `competition`)
- Stornierung (`canceled`/`no`) bleibt auch nach Fristablauf möglich — Admin entscheidet dann selbst über die LADV-Abmeldung
- Initiale Anmeldung ist immer `registered` (bei ladv/competition) bzw. `yes` (bei training/social)

### LADV-Operationsstatus (separates Tracking, admin-kontrolliert)

| Zustand                      | Bedingung                                    | Wer setzt |
|------------------------------|----------------------------------------------|-----------|
| Noch nicht bei LADV gemeldet | `ladv_registered_at IS NULL`                 | —         |
| Bei LADV angemeldet          | `ladv_registered_at IS NOT NULL`             | Admin     |
| Bei LADV abgemeldet          | `ladv_canceled_at IS NOT NULL`               | Admin     |

**Kritischer Grenzfall:** Ein Mitglied hat `status = 'canceled'` gesetzt, aber `ladv_registered_at` ist bereits gesetzt (Kevin hat die Person vorher bei LADV angemeldet). In diesem Fall muss die UI für den Admin deutlich sichtbar machen: "X hat abgesagt — LADV-Abmeldung noch ausstehend."

---

## E-Mail-Trigger-Matrix

### Synchron (Must)

| ID   | Auslöser                                              | Empfänger              |
|------|-------------------------------------------------------|------------------------|
| E-01 | Mitglied meldet sich an (`registered` / `yes`)        | Mitglied               |
| E-02 | Mitglied storniert (`canceled` / `no`)                | Mitglied               |
| E-03 | Admin protokolliert LADV-Anmeldung                    | Mitglied               |
| E-04 | Admin protokolliert LADV-Abmeldung                    | Mitglied               |
| E-05 | Anmeldung weniger als 3 Tage vor Meldefrist           | Alle Admins            |

### Asynchron / Cronjob (Could — Kevin-Input erbeten, → F-K3)

| ID   | Auslöser                                              | Empfänger              |
|------|-------------------------------------------------------|------------------------|
| E-06 | 5 Tage vor Meldefrist                                 | Angemeldete Mitglieder |
| E-07 | 3 Tage vor Meldefrist                                 | Alle Admins            |
| E-08 | 2 Tage vor Event                                      | Angemeldete Mitglieder |

**Kein E-Mail-Trigger bei:** `maybe`-Status, Kommentaren, Event-Erstellung

**Offene Frage:** Soll bei manueller Event-Absage (F-11) automatisch eine Massen-Mail an alle Angemeldeten gehen? → OE-4

---

## Offene Entscheidungen

| ID   | Frage                                                       | Empfehlung                                          | Input von  |
|------|-------------------------------------------------------------|-----------------------------------------------------|------------|
| OE-1 | LADV-Startpass: Campai-Sync oder weglassen?                 | Option A wenn Campai-Daten zuverlässig              | Kevin      |
| OE-2 | Asynchrone E-Mails: welche davon wirklich gebraucht?        | Could — Kevin priorisiert                           | Kevin      |
| OE-3 | Disziplinen bei normalen Wettkämpfen (`competition`)        | Won't für v2; Schema vorbereitet (ADR-004)          | —          |
| OE-4 | Massen-Mail bei Event-Absage                                | Wahrscheinlich sinnvoll, aber explizite Entscheidung nötig | Kevin |

---

## Kevin-Briefing

_Kevin hat technischen Hintergrund und wird sich die vollständige Feature Spec ansehen. Dieser Abschnitt gibt ihm den fachlichen Einstieg und stellt die konkreten Fragen, auf die wir Input brauchen._

---

### Was die App macht

Alle BTC-Mitglieder loggen sich per Magic-Link ein (E-Mail → Link klicken) und können sich zu Wettkämpfen, Trainings und Vereinsevents anmelden. Jedes Mitglied kann auch selbst Events anlegen. Die App kennt vier Event-Typen:

- **LADV-Wettkämpfe** — importiert aus der LADV-Datenbank via Ausschreibungslink, Athleten wählen bei Anmeldung Disziplin und Altersklasse
- **Normale Wettkämpfe** — manuell angelegt, einfache Anmeldung
- **Training** — Ja/Nein/Vielleicht, kein Admin-Bestätigungsschritt
- **Vereinsevents** — wie Training, für Teamausflüge, Vereinsfeiern o.ä.

Du und die anderen Admins habt zusätzliche Funktionen: alle Events verwalten und bearbeiten, LADV-Events importieren, und den LADV-Meldestatus nachpflegen nachdem ihr die Anmeldung auf der LADV-Website gemacht habt.

---

### Was sich gegenüber v1 ändert

| Aspekt | v1 | v2 |
|--------|----|----|
| Anmeldung | Anonym (nur E-Mail-Eingabe) | Hinter Login — Mitglied ist identifiziert |
| Mitgliederverwaltung | Excel-Import manuell | Campai-Sync automatisch |
| LADV-Sync | Sync überschreibt manuelle Korrekturen | Deine Korrekturen bleiben erhalten |
| Event-Typen | Nur Wettkämpfe | + Training, Vereinsevents |
| Event-Anlage | Nur Admins | Alle Mitglieder |
| LADV-Import | Noch nicht vorhanden | Via Ausschreibungslink, auto-befüllt |
| Anmeldestatus | `pending` → `confirmed` / `canceled` | Direkt `registered` — kein Bestätigungs-Zwischenschritt |

---

### Dein Workflow (LADV-Events)

1. Jemand importiert ein LADV-Event per Ausschreibungslink → App liest alle Daten automatisch ein
2. Athleten melden sich an und wählen Disziplin + Altersklasse
3. Du gehst auf die LADV-Website und meldest Athleten an
4. Du trägst das in der App nach (ein Klick pro Athlet) → Bestätigungs-Mail geht automatisch raus
5. Bei Abmeldung: gleicher Ablauf → ein Klick → Abmelde-Mail raus

---

### Fragen für dich, Kevin

#### F-K1 — LADV-Startpass

In v1 war hinterlegt ob ein Mitglied einen LADV-Startpass hat — ohne Startpass war die Anmeldung bei LADV-Events gesperrt. Dieses Feld soll auch in Campai vorhanden sein.

**Zwei Optionen:**
- **A)** Die App übernimmt das Feld automatisch beim Campai-Sync und sperrt Anmeldungen ohne Startpass → Mitglied sieht eine klare Fehlermeldung, du sparst die manuelle Prüfung
- **B)** Das Feld wird in v2 weggelassen → du checkst selbst beim Anmelden auf der LADV-Website

Ist das Feld in Campai zuverlässig gepflegt? Bitte sag mir, welche Option du bevorzugst.

---

#### F-K2 — Automatische Erinnerungs-Mails

Geplant sind zeitgesteuerte E-Mails (Cronjob). Bitte sag kurz ob du die folgenden drei für sinnvoll hältst:

| Mail | Wann | An wen |
|------|------|--------|
| Erinnerung Meldefrist | 5 Tage vor Meldefrist | Angemeldete Mitglieder |
| Hinweis Meldefrist | 3 Tage vor Meldefrist | Alle Admins |
| Event steht bevor | 2 Tage vor Event | Angemeldete Mitglieder |

Welche davon hätten in der Praxis Mehrwert — und welche würden eher nerven?

---

#### F-K3 — Massen-Mail bei Event-Absage

Wenn ein LADV-Event abgesagt wird (erkannt beim nächsten Sync oder von dir manuell gesetzt):

**Frage:** Soll die App automatisch alle angemeldeten Mitglieder per Mail informieren? Oder willst du das manuell kontrollieren (erst schauen, dann entscheiden ob du Bescheid gibst)?
