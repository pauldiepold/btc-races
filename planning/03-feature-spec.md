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

| Rolle      | Beschreibung                                                                                      | Anzahl |
|------------|---------------------------------------------------------------------------------------------------|--------|
| Mitglied   | Eingeloggtes BTC-Mitglied, kann sich anmelden und Events anlegen                                 | ~100+  |
| Admin      | Kevin + Vereinsverantwortliche, verwalten Events und LADV-Workflow                               | ~10    |
| Superuser  | Technischer Administrator (Paul) — hat alle Admin-Rechte + kann Systemoperationen ausführen (Campai-Sync manuell anstoßen, künftig mehr) | 1 |
| System     | Automatische Prozesse (Campai-Sync, E-Mail-Cronjobs, Push)                                       | —      |

Admins sind reguläre User mit `role = 'admin'` in der `users`-Tabelle. Superuser hat `role = 'superuser'`. **Rollen werden ausschließlich beim Campai-Sync gesetzt** — kein manuelles Admin-UI:

| Rolle | Bedingung beim Campai-Sync |
|-------|---------------------------|
| `superuser` | E-Mail `paul@diepold.de` (hartcodiert) |
| `admin` | Campai-Section `"Coaches"` |
| `member` | alle anderen aktiven Mitglieder |

Ausgetretene Mitglieder (nicht mehr in Campai aktiv) erhalten `membershipStatus = 'inactive'` und können sich **nicht mehr einloggen**. Ihre Daten (Anmeldungen, Kommentare) bleiben erhalten.

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
- Zusätzliche Filter (hauptsächlich für `competition` + `ladv`-Events mit gesetzten Werten):
  - `raceType`: `track` \| `road`
  - `championshipType`: `none` \| `bbm` \| `ndm` \| `dm`
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

**Beschreibung:** Mitglied meldet sich erstmalig zu einem Event an.

**Akzeptanzkriterien:**
- Bei `ladv`-Events: Mitglied wählt mindestens eine Disziplin aus der `wettbewerbe`-Liste in `ladv_data`. Pro Disziplin wird die zugehörige Altersklasse (`klasseNew`) aus derselben Liste gewählt — beide Felder required. **Mehrere Disziplinen pro Anmeldung möglich** (z.B. 100m + 200m), jede Disziplin ist ein eigener Eintrag in `registration_disciplines` (→ ADR-004 Update).
- Bei `competition`-Events: nur optionales Notiz-Feld
- Bei `training`- und `social`-Events: nur optionales Notiz-Feld; initialer Status ist `yes` (nicht `registered`)
- **Notiz-Feld** (alle Event-Typen, optional): für alle eingeloggten Mitglieder öffentlich sichtbar — das muss im UI klar kommuniziert werden (z.B. "Öffentliche Notiz — für alle Mitglieder sichtbar")
- Anmeldung nach abgelaufener Meldefrist gesperrt (bei `ladv` + `competition`); `training` und `social` haben keine Frist
- Anmeldung bei abgesagtem Event gesperrt
- Doppelte Anmeldung nicht möglich (UNIQUE constraint `event_id + user_id`)
- Nach Anmeldung: E-Mail-Bestätigung an Mitglied (→ E-01)
- Bei Anmeldung weniger als 3 Tage vor Meldefrist: E-Mail an alle Admins (→ E-05)

**Abhängigkeiten:** F-02

---

#### F-04: Anmeldung bearbeiten

**Priorität:** Must

**Beschreibung:** Mitglied ändert eine bestehende Anmeldung — Status, Disziplinen oder Notiz. Deckt alle Übergänge der State Machine ab (ersetzt frühere F-04 Stornierung + F-05 Vielleicht).

**State Machine — Status-Übergänge je Event-Typ:**

| Event-Typ     | Mögliche Status                         | Zeitregel                          |
|---------------|-----------------------------------------|------------------------------------|
| `ladv`        | `registered` ↔ `canceled`              | Vor Meldefrist (Storno immer möglich) |
| `competition` | `registered` ↔ `maybe` ↔ `no`         | Vor Meldefrist (Absage `no` immer möglich) |
| `training`    | `yes` ↔ `maybe` ↔ `no`                 | Jederzeit                          |
| `social`      | `yes` ↔ `maybe` ↔ `no`                 | Jederzeit                          |

**Akzeptanzkriterien:**
- Statusänderung jederzeit möglich solange Meldefrist nicht abgelaufen (bei `ladv` + `competition`); Ausnahme: Absage (`canceled`/`no`) bleibt immer möglich
- Keine E-Mail bei `maybe`-Status
- Bei Stornierung: E-Mail-Bestätigung an Mitglied (→ E-02)
- Bei `ladv`-Events mit gesetztem `ladv_registered_at` für eine Disziplin: deutlicher Hinweis im UI — "Diese Disziplin ist bereits bei LADV angemeldet — Admin informieren"
- **Disziplinen ändern (nur `ladv`, vor Meldefrist):** Disziplinen hinzufügen und entfernen möglich. Mindestens eine Disziplin muss verbleiben.
- **Notiz-Feld:** jederzeit editierbar (auch nach Fristablauf)
- `maybe`-Anmeldungen erscheinen in der Teilnehmerliste mit eigenem Badge

**Abhängigkeiten:** F-03

---

#### F-06: Eigene Anmeldungsübersicht

**Priorität:** Should

**Beschreibung:** Mitglied hat eine Übersicht aller eigenen Anmeldungen.

**Akzeptanzkriterien:**
- Seite `/profil` mit allen eigenen Anmeldungen
- Sortierung nach Datum, neueste zuerst
- Zeigt: Event-Name, Datum, Typ, eigener Status, LADV-Status (bei `ladv`-Events: ob bei LADV angemeldet)
- Direktlink zur Event-Detailseite

**Offene Frage (bei Implementierung klären):** Soll `/profil` nur die Anmeldungsübersicht enthalten, oder wird daraus eine vollständige Profilseite (Avatar, Stammdaten, Abteilungen aus Campai)? Falls Letzteres: Anmeldungen als Tab oder eigenständiger Bereich?

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
- Editierbare Felder: Name, Datum, Ort, Meldefrist, Ausschreibungslink, Beschreibung, Rennart, Meisterschaft
  - `raceType` (Rennart): editierbar bei `competition` und `ladv`
  - `championshipType` (Meisterschaft): editierbar nur bei `ladv` (kommt immer aus LADV-Kontext; bei manuellen Events kein LADV-Äquivalent)
- Manuelle Änderungen überstehen spätere LADV-Syncs (Sync schreibt nur `ladv_data` + `ladv_last_sync`, nicht normalisierte Felder — ADR-003)
- Bei LADV-Events: Diff-Hinweise im Bearbeitungsformular pro Feld (→ F-10) — kein Diff auf der Detailseite
- Typ-Änderung nach dem Anlegen nicht möglich
- Zugriff: Admin (alle Events) oder Ersteller (nur eigene Events, `created_by = session.id`)
- Route: `/events/[id]/bearbeiten` — separate Seite (nicht Inline/Modal)

**Abhängigkeiten:** F-07, F-08

---

#### F-10: LADV-Sync + Diff-Hinweis

**Priorität:** Must (Sync) / Should (Diff-Hinweis)

**Beschreibung:** Admin aktualisiert LADV-Daten manuell. Bearbeitungsformular zeigt Abweichungen zwischen gespeicherten Feldern und LADV-Quelldaten.

**Akzeptanzkriterien:**
- "Sync"-Button auf der Detailseite eines LADV-Events (admin-only)
- Sync aktualisiert `ladv_data` + `ladv_last_sync`; normalisierte Felder werden nicht überschrieben (ADR-003)
- Wenn LADV-Daten `abgesagt: true` enthalten: `cancelled_at` wird automatisch gesetzt. Keine automatische Mail an Athleten — Admin entscheidet (→ OE-4)
- **Diff-Hinweis (Should):** Abweichungen werden **im Bearbeitungsformular** angezeigt (nicht auf der Detailseite) — saubere Trennung Read/Write. Verglichene Felder: `name`, `date`, `location`, `registrationDeadline`, `raceType`, `championshipType`. Pro abweichendem Feld: LADV-Wert + "Übernehmen"-Button (kopiert Wert reaktiv ins Formularfeld, kein extra API-Call).
- Nach Sync: Toast "LADV-Daten aktualisiert"; bei erkannten Diffs: Toast mit Link zum Bearbeitungsformular
- Letzter Sync-Zeitpunkt (`ladv_last_sync`) auf der Eventseite sichtbar

**Abhängigkeiten:** F-09

---

#### F-11: Event absagen

**Priorität:** Should

**Beschreibung:** Admin markiert ein Event manuell als abgesagt. Die Absage ist reversibel.

**Akzeptanzkriterien:**
- Setzt `cancelled_at` auf den aktuellen Zeitpunkt — mit Bestätigungsdialog (UModal)
- Absage ist **reversibel**: "Reaktivieren"-Button setzt `cancelled_at` zurück auf null
- Kein echtes Löschen — Event bleibt in der DB und in der UI sichtbar (mit "Abgesagt"-Badge)
- Bestehende Anmeldungen bleiben unverändert erhalten
- Ob eine automatische Massen-Mail an Angemeldete gesendet wird: → OE-4

**Abhängigkeiten:** F-07, F-08

---

#### F-12: Anmeldungen einsehen

**Priorität:** Must

**Beschreibung:** Alle eingeloggten Mitglieder sehen wer sich angemeldet hat. Admins sehen zusätzlich den LADV-Operationsstatus.

**Sichtbarkeit:**

| Feld                                  | Mitglied       | Admin          |
|---------------------------------------|----------------|----------------|
| Name + Anmeldestatus                  | ✅              | ✅              |
| Disziplin + Altersklasse (bei `ladv`) | ✅              | ✅              |
| Notiz                                 | ✅ (öffentlich) | ✅              |
| LADV-Operationsstatus (alle User)     | ❌              | ✅              |
| Eigener LADV-Operationsstatus         | ✅              | ✅              |

**Akzeptanzkriterien:**
- Grundlegende Teilnehmerliste (Name, Status, Disziplin, Notiz) für alle eingeloggten Mitglieder sichtbar — auch auf der Detailseite (F-02)
- Admins sehen zusätzlich: LADV-Operationsstatus aller Angemeldeten — "Noch nicht bei LADV gemeldet" / "Bei LADV angemeldet am [Datum] von [Coach]" / "Bei LADV abgemeldet am [Datum] von [Coach]"
- Jedes Mitglied sieht den eigenen LADV-Operationsstatus
- Admin-Ansicht: filterbar nach Anmeldestatus
- CSV-Export oder copy-paste-freundliche Darstellung: **Could**

**Abhängigkeiten:** F-03

---

#### F-13: LADV-Anmeldung protokollieren

**Priorität:** Must

**Beschreibung:** Admin protokolliert, dass er einen Teilnehmer manuell auf der LADV-Website angemeldet hat. Protokollierung erfolgt **pro Disziplin** (da Kevin je Disziplin separat auf LADV anmeldet).

**Akzeptanzkriterien:**
- Setzt `ladv_registered_at` (Zeitstempel) und `ladv_registered_by` (standardmäßig Name aus der Session, editierbar falls ein anderer Coach gemeldet hat) — **auf Disziplin-Ebene** (`registration_disciplines`, → ADR-004 Update)
- Aktion nur möglich wenn `registration.status = 'registered'`
- Aktion nur möglich wenn `ladv_registered_at` für diese Disziplin noch nicht gesetzt (kein versehentliches Überschreiben)
- Nach Protokollierung der ersten / aller Disziplinen: E-Mail-Bestätigung an Teilnehmer (→ E-03)
- Wenn `ladv_registered_at` für eine Disziplin bereits gesetzt: nur Anzeige, kein Button

**Abhängigkeiten:** F-12

---

#### F-14: LADV-Abmeldung protokollieren

**Priorität:** Must

**Beschreibung:** Admin protokolliert, dass er einen Teilnehmer manuell auf der LADV-Website abgemeldet hat. Protokollierung erfolgt **pro Disziplin**.

**Akzeptanzkriterien:**
- Setzt `ladv_canceled_at` + `ladv_canceled_by` auf Disziplin-Ebene
- Aktion nur möglich wenn `ladv_registered_at` für diese Disziplin gesetzt (man kann nur abmelden was angemeldet wurde)
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

**Priorität:** Must — **teilweise implementiert** (Rollen-Zuweisung + Inactive-Login-Block fehlen noch, → 9.2.1)

**Beschreibung:** Automatischer Abgleich aktiver Vereinsmitglieder aus Campai in die `users`-Tabelle.

**Was der Sync tut:**
- Aktive Mitglieder: upsert in `users` mit allen Feldern inkl. `role`, `hasLadvStartpass`, `gender`, `age`, `birthday`
- Rollen-Zuweisung: `superuser` wenn E-Mail `paul@diepold.de`; `admin` wenn Section `"Coaches"`; sonst `member`
- Nicht mehr aktive Mitglieder: `membershipStatus = 'inactive'` setzen (Daten bleiben erhalten)

**Login-Sperre für inaktive Member:**
- `POST /api/auth/login`: wenn User existiert aber `membershipStatus = 'inactive'` → gleiche Response wie "User nicht gefunden" (kein Hinweis auf Status nach außen)
- `GET /verify`: wenn Token valid aber User inaktiv → 403

**Status:** Sync-Logik implementiert. Rollen-Zuweisung (Coaches-Section, Superuser-Hardcode) und Login-Sperre für inaktive User stehen noch aus (→ 9.2.1 + 9.2.2).

---

#### F-22: LADV-Startpass via Campai

**Priorität:** Must

**Beschreibung:** `has_ladv_startpass` wird beim Campai-Sync übernommen und blockiert die Anmeldung bei LADV-Events ohne gültigen Startpass.

**Entscheidung:** Option A — Campai-Sync. Daten in Campai sind sauber gepflegt.

**Akzeptanzkriterien:**
- `has_ladv_startpass`-Feld wird beim Campai-Sync aus Campai übernommen
- Anmeldung bei `ladv`-Events ist nur möglich wenn `has_ladv_startpass = true`
- Mitglied ohne Startpass sieht klare Fehlermeldung mit Hinweis (z.B. "Du hast keinen gültigen LADV-Startpass — wende dich an den Vorstand")

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

#### F-24: Superuser Admin-Seite

**Priorität:** Must

**Beschreibung:** Superuser hat eine geschützte Admin-Seite für Systemoperationen. Erster Use-Case: Campai-Sync manuell anstoßen. Seite ist erweiterbar für künftige Systemoperationen.

**Akzeptanzkriterien:**
- Route `/superuser/system` — ausschließlich zugänglich mit `role = 'superuser'` (allgemeiner `/admin`-Bereich ist für `admin` + `superuser`; Systemoperationen liegen unter `/superuser`)
- Button "Campai-Sync anstoßen" — ruft den bestehenden `POST /api/cron/sync-members`-Endpunkt auf
- Feedback nach dem Sync: Erfolg / Fehler anzeigen (Anzahl synchronisierter Mitglieder o.ä.)
- Seite ist bewusst minimal gehalten — kein Feature-Bloat, nur was gebraucht wird

**Abhängigkeiten:** F-21

---

#### F-25: Dev-Seeding

**Priorität:** Must (Dev-Only)

**Beschreibung:** Ein einzelner Befehl (`pnpm db:seed`) baut die lokale Entwicklungs-Datenbank mit realistischen Testdaten auf. Ziel: alle Features direkt explorierbar, alle Edge Cases abgedeckt, alle Rollen testbar.

**Auslösung:** `pnpm db:seed` — manuell, separat vom Dev-Server. Nicht Teil des automatischen `pnpm dev`-Starts.

**Strategie:** Vor dem Seed wird die DB vollständig geleert (`DELETE FROM` aller Tabellen in Abhängigkeitsreihenfolge). Dann werden alle Daten neu aufgebaut — deterministisch, keine Merge-Logik.

---

**Schritt 1 — Echte Mitglieder (Campai-Sync)**

Der bestehende Nitro-Task `sync-members` wird direkt aufgerufen. Damit sind ~100 echte BTC-Mitglieder in der `users`-Tabelle.

---

**Schritt 2 — Test-User (hardcoded, per Upsert)**

4 feste Accounts werden nach dem Sync per Upsert eingetragen bzw. ihre Rolle gesetzt:

| Account | Rolle | Zweck |
|---------|-------|-------|
| paul@… (eigene E-Mail) | `superuser` | Alle Rechte, Systemoperationen |
| testadmin@btc-berlin.de | `admin` | Admin-Workflows testen (LADV-Protokollierung etc.) |
| testmember1@btc-berlin.de | `member` | Reguläres Mitglied mit Startpass |
| testmember2@btc-berlin.de | `member` | Reguläres Mitglied ohne Startpass (→ F-22 testen) |

Login im Dev-Modus: Magic-Link landet im Terminal (Console-Provider). Kein Dev-Bypass notwendig.

---

**Schritt 3 — LADV-Events (echte API)**

Ein Placeholder-Array mit Ausschreibungs-IDs wird hardcoded in der Seed-Datei abgelegt:

```ts
const LADV_IDS = [
  // Ausschreibungs-IDs hier eintragen
]
```

Pro ID wird die echte LADV-API aufgerufen (identisch zu F-08). Bei nicht erreichbarer API fällt der Seed auf eine gecachte JSON-Fixture-Datei pro ID zurück (`server/db/seed/ladv-fixtures/`), damit das Seeding auch offline funktioniert.

Ziel: **~8 LADV-Events**, davon:
- ~5 in der Zukunft (mit Meldefrist, verschiedene Zeitabstände)
- ~3 in der Vergangenheit

---

**Schritt 4 — Generierte Events (Faker)**

`@faker-js/faker` mit `de`-Locale generiert realistische Daten für die übrigen Event-Typen:

| Typ | Anzahl | Details |
|-----|--------|---------|
| `competition` | 8 | Mel­defrist mal abgelaufen, mal noch offen, mal weit in der Zukunft |
| `training` | 10 | Mix aus vergangenen und zukünftigen |
| `social` | 9 | Mix, ein Event ohne Datum (tbd) |

Zeitliche Verteilung gesamt: ~60 % Zukunft, ~40 % Vergangenheit.

`created_by` wird zufällig einem der 4 Test-User zugewiesen.

---

**Schritt 5 — Anmeldungen**

Zufällige Anmeldungen von Mitgliedern aus dem Campai-Pool + Test-Usern. Pro Event werden zwischen 3 und 15 Mitglieder angemeldet.

Explizit abgedeckte Szenarien (hardcoded, nicht zufällig):

| Szenario | Beschreibung |
|----------|--------------|
| `registered` + `ladv_registered_at` gesetzt | Kevin hat bereits bei LADV angemeldet |
| `canceled` + `ladv_registered_at` gesetzt | Abgesagt nach LADV-Meldung — Grenzfall aus Status-Modell |
| `canceled` + `ladv_registered_at` + `ladv_canceled_at` gesetzt | Vollständiger LADV-Abmelde-Flow |
| Anmeldung < 3 Tage vor Meldefrist | E-05-Trigger testbar |
| `maybe` bei Competition | Badge-Darstellung testbar |
| Mitglied ohne Startpass versucht LADV-Anmeldung | Soll im UI geblockt werden (→ F-22) |
| `testmember2` (kein Startpass) hat trotzdem eine alte Anmeldung | Migration-Edge-Case |

---

**Schritt 6 — Kommentare und Announcements**

Pro Event mit Anmeldungen werden 0–3 zufällige Mitglieder-Kommentare generiert. Zusätzlich:
- 2–3 Events erhalten eine Admin-Announcement (gepinnt, Type `announcement`)
- Inhalte: kurze Faker-Sätze auf Deutsch

---

**Technische Umsetzung**

- Seed-Logik: `server/db/seed/index.ts` — aufgerufen via Nitro-Task `db:seed`
- `pnpm db:seed` in `package.json` als Script-Alias
- LADV-Fixture-Fallback: `server/db/seed/ladv-fixtures/<id>.json`
- Faker als `devDependency`

**Abhängigkeiten:** F-21, F-03, F-13, F-14, F-15, F-16

---

## Status-Modell

### Registrierungs-Status je Event-Typ

| Event-Typ     | Mögliche Werte                          | Steuerung |
|---------------|-----------------------------------------|-----------|
| `ladv`        | `registered` ↔ `canceled`              | Mitglied  |
| `competition` | `registered` ↔ `maybe` ↔ `no`         | Mitglied  |
| `training`    | `yes` ↔ `maybe` ↔ `no`                 | Mitglied  |
| `social`      | `yes` ↔ `maybe` ↔ `no`                 | Mitglied  |

**Hinweise:**
- Bei `ladv` kein `maybe` — LADV erfordert eine verbindliche Meldung
- `training` und `social` verhalten sich identisch: kein Admin-Bestätigungsschritt, keine Meldefrist, initialer Status `yes`
- Übergänge sind in alle Richtungen frei möglich, solange die Meldefrist nicht abgelaufen ist (bei `ladv` und `competition`)
- Absage (`canceled` bei `ladv`, `no` bei `competition`/`training`/`social`) bleibt auch nach Fristablauf möglich — Admin entscheidet dann selbst über die LADV-Abmeldung
- Initiale Anmeldung ist immer `registered` (bei ladv/competition) bzw. `yes` (bei training/social)
- Vollständige State Machine inkl. Disziplin-Änderungen: → F-04

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

### Asynchron / Cronjob `[Backlog]`

_Nicht für MVP — kein Mehrwert für Kernfunktionalität. Wird nach dem Launch priorisiert._

| ID   | Auslöser                                              | Empfänger              |
|------|-------------------------------------------------------|------------------------|
| E-06 | 5 Tage vor Meldefrist                                 | Angemeldete Mitglieder |
| E-07 | 3 Tage vor Meldefrist                                 | Alle Admins            |
| E-08 | 2 Tage vor Event                                      | Angemeldete Mitglieder |

**Kein E-Mail-Trigger bei:** `maybe`-Status, Kommentaren, Event-Erstellung

### Massen-Mail bei Event-Absage `[Backlog]`

Wenn ein Event abgesagt wird (F-11, F-10): automatische Mail an alle Angemeldeten. Nicht für MVP — Admin kommuniziert das vorerst manuell. Wird nach dem Launch umgesetzt.

---

## Offene Entscheidungen

Alle offenen Entscheidungen sind geklärt. Keine ausstehenden Punkte.

| ID   | Frage                                            | Entscheidung                                                  |
|------|--------------------------------------------------|---------------------------------------------------------------|
| OE-1 | LADV-Startpass: Campai-Sync oder weglassen?      | ✅ Option A — Campai-Sync, Daten sind sauber (→ F-22)         |
| OE-2 | Asynchrone E-Mails: welche davon gebraucht?      | ✅ Backlog — nicht MVP, nach Launch priorisieren               |
| OE-3 | Disziplinen bei normalen Wettkämpfen             | ✅ Won't für v2; Schema vorbereitet (ADR-004)                  |
| OE-4 | Massen-Mail bei Event-Absage                     | ✅ Backlog — Admin kommuniziert vorerst manuell (→ E-Mail-Trigger-Matrix) |

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

_Alle Fragen wurden besprochen. Kevin-Briefing abgeschlossen._
