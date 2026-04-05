# Schritt 2.2 — Datenmodell-Entwurf

_Abgestimmt am 2026-03-31_

---

## Entscheidungen (ADR-Format)

---

### ADR-001: Event-Typen — eine Tabelle

**Entscheidung:** Eine `events`-Tabelle mit `type`-Feld (`ladv` | `competition` | `training` | `social`). Typ-spezifische Felder sind nullable.

Es gibt vier Event-Typen: LADV-Wettkampf, normaler Wettkampf, Training und soziale Teamevents (Ausflüge etc.). `training` und `social` verhalten sich identisch (freiwillige Teilnahme, initialer Status `yes`, kein Admin-Bestätigungsschritt, keine Meldefrist). `social` wurde in Schritt 6 als eigener Typ ergänzt um spätere Filterung/UI-Differenzierung zu ermöglichen — das `type`-Feld ist ein Text-Feld, weitere Werte können jederzeit ergänzt werden.

**Begründung:** Die Überschneidung zwischen den Typen ist groß (name, date, location, registrations). Separate Tabellen würden alle Queries verkomplizieren. SQLite hat kein Table-Inheritance. `training` als Can-Feature — vorbereiten ohne aufzublähen.

**Konsequenzen:** Validierung welche Felder je Typ required sind, liegt in der App-Logik, nicht im Schema.

---

### ADR-002: LADV-Daten — normalisierte Felder + JSON-Blob

**Entscheidung:** Folgende Felder werden normalisiert (eigene Spalten): `name`, `date`, `location`, `registration_deadline`, `announcement_link`, `ladv_id`, `ladv_last_sync`, `cancelled_at`. Alles andere (veranstalter, ausrichter, sportstaette, wettbewerbe, Links, Anhänge etc.) bleibt im `ladv_data`-JSON-Blob.

**Begründung:** Normalisiert wird nur was für Listendarstellung, Fristprüfung oder Sync-Management direkt gebraucht wird. `veranstalter`/`ausrichter` werden nur auf der Detailseite gezeigt — JSON reicht. `cancelled_at` als eigene Spalte macht Absagen im Sync klar nachvollziehbar (wann erkannt).

**Konsequenzen:** Detail-Ansicht liest LADV-spezifische Metadaten direkt aus `ladv_data`. Kein Normalisierungsaufwand bei Schema-Erweiterungen der LADV-API.

---

### ADR-003: Feldpräzedenz — LADV vs. manuelle Überschreibung

**Entscheidung:** LADV-Import befüllt alle normalisierten Felder initial. LADV-Sync aktualisiert danach **nur** `ladv_data`, `ladv_last_sync` und `cancelled_at` — keine normalisierten Felder. Admins können alle normalisierten Felder frei bearbeiten, ohne dass ein Sync sie überschreibt.

**Begründung:** In v1 hat jeder Sync alle Felder überschrieben — Korrekturen durch Kevin wurden verloren. Kein `_override`-Flag nötig, kein Duplikat-Feld.

**Konsequenzen:** Das Frontend kann beim Anzeigen eines Events prüfen, ob normalisierte Felder (z.B. `date`, `name`) von den Werten in `ladv_data` abweichen, und einen Hinweis anzeigen. Kein Sync-seitiger Aufwand dafür.

---

### ADR-004: Disziplinen & Altersklassen _(aktualisiert durch ADR-007)_

~~Ursprüngliche Entscheidung: `discipline` + `age_class` als nullable Spalten direkt in `registrations`.~~

Ersetzt durch ADR-007 — siehe unten.

---

### ADR-005: Registrierungs-Status

**Entscheidung:** Ein `status`-Textfeld in `registrations`, vom User kontrolliert: `registered` | `canceled` | `maybe` | `yes` | `no`. LADV-Operationsstatus wird separat getrackt: `ladv_registered_at`, `ladv_registered_by`, `ladv_canceled_at`, `ladv_canceled_by`.

Gültige Status-Werte je Typ:
- `ladv`: `registered` | `canceled`
- `competition`: `registered` | `canceled` | `maybe`
- `training`: `yes` | `no` | `maybe`

**Begründung:** User-Intent und LADV-Operationsstatus sind konzeptuell getrennt. `pending_cancellation` entfällt: User setzt `canceled`, Kevin sieht das und protokolliert die LADV-Abmeldung via `ladv_canceled_at/by`. Ob jemand bei LADV gemeldet ist, ergibt sich aus `ladv_registered_at IS NOT NULL`. `maybe` gilt für competition + training — nur bei LADV ist eine eindeutige Meldung erforderlich.

**Konsequenzen:** Gültige Status-Werte je Event-Typ werden in der App-Logik validiert.

---

### ADR-007: Multi-Disziplin-Anmeldung — `registration_disciplines`-Tabelle

_Ergänzt in Schritt 6.5_

**Entscheidung:** Neue Tabelle `registration_disciplines`. Jede Disziplin-Wahl eines Mitglieds bei einem LADV-Event ist ein eigener Datensatz. Die LADV-Operationsfelder (`ladv_registered_at/by`, `ladv_canceled_at/by`) wandern von `registrations` auf diese Ebene, da Kevin pro Disziplin separat auf der LADV-Website anmeldet bzw. abmeldet.

Die Felder `discipline`, `age_class` sowie die LADV-Operationsfelder werden aus `registrations` entfernt.

**Begründung:** Ein Mitglied kann sich für mehrere Disziplinen (z.B. 100m + 200m) anmelden. LADV-Protokollierung erfolgt je Disziplin separat. Die `registration_disciplines`-Tabelle existiert ausschließlich für `type = 'ladv'`-Events — für alle anderen Typen gibt es keine Disziplin-Einträge.

**UNIQUE Constraint:** `(registration_id, discipline)` — dieselbe Disziplin kann pro Anmeldung nur einmal eingetragen werden. (AK kommt immer fest mit der Disziplin aus `wettbewerbe`, braucht keinen separaten Constraint.)

**Konsequenzen:**
- Bei LADV-Events: mindestens ein Eintrag in `registration_disciplines` required (App-Validierung)
- LADV-Operationsstatus wird pro Disziplin abgelesen, nicht pro Anmeldung
- `registrations.status` (`registered` | `canceled`) bleibt auf Anmeldungsebene

---

### ADR-006: Kommentare & Ankündigungen

**Entscheidung:** Eine `event_comments`-Tabelle mit `type`-Feld (`comment` | `announcement`). Announcements werden im Frontend oben gepinnt — reine UI-Logik. Emoji-Reaktionen als Bonus-Feature: eigene `reactions`-Tabelle mit FK auf `event_comments.id`.

**Begründung:** Beide Typen haben identische Felder. Eine Tabelle vermeidet Duplikation und vereinfacht Queries (z.B. "alle Kommentare + Announcements für ein Event"). `reactions` als separate Tabelle ist später einfach anhängbar.

**Konsequenzen:** Beim Anzeigen nach `type` filtern/sortieren (Announcements immer oben).

---

## Beschlossenes Schema

### `events`

| Spalte                | Typ                              | Beschreibung                                                                 |
|-----------------------|----------------------------------|------------------------------------------------------------------------------|
| id                    | text PK                          | UUID                                                                         |
| type                  | text NOT NULL                    | `ladv` \| `competition` \| `training` \| `social`                            |
| name                  | text NOT NULL                    |                                                                              |
| date                  | integer (timestamp)              |                                                                              |
| location              | text                             |                                                                              |
| description           | text                             | Freitext-Beschreibung, für alle Event-Typen                                  |
| registration_deadline | integer (timestamp)              | null bei training/social                                                     |
| announcement_link     | text                             |                                                                              |
| cancelled_at          | integer (timestamp)              | gesetzt beim Sync wenn LADV `abgesagt: true`                                 |
| race_type             | text                             | `track` \| `road` — nur competition + ladv; bei ladv aus `kategorien`        |
| championship_type     | text                             | `none` \| `bbm` \| `ndm` \| `dm` — manuell gepflegt, nicht aus LADV-API     |
| is_wrc                | integer (boolean) NOT NULL DEF 0 | World Ranking Competition; bei ladv aus `wrc`-Feld                           |
| ladv_id               | integer                          | nur bei type=ladv                                                            |
| ladv_data             | text (JSON)                      | Rohdaten LADV-API inkl. wettbewerbe-Liste                                    |
| ladv_last_sync        | integer (timestamp)              |                                                                              |
| created_by            | text FK → users.id               |                                                                              |
| createdAt             | integer (timestamp) NOT NULL     |                                                                              |
| updatedAt             | integer (timestamp) NOT NULL     |                                                                              |

### `registrations`

| Spalte    | Typ                          | Beschreibung                                                                           |
|-----------|------------------------------|----------------------------------------------------------------------------------------|
| id        | text PK                      | UUID                                                                                   |
| event_id  | text FK → events.id          |                                                                                        |
| user_id   | text FK → users.id           |                                                                                        |
| status    | text NOT NULL                | `registered`\|`canceled`\|`maybe` (ladv+competition), `yes`\|`no`\|`maybe` (training\|social) |
| notes     | text                         | Freitext-Hinweis des Mitglieds an Admins; öffentlich für alle Mitglieder sichtbar      |
| createdAt | integer (timestamp) NOT NULL |                                                                                        |
| updatedAt | integer (timestamp) NOT NULL |                                                                                        |
| UNIQUE    |                              | (event_id, user_id)                                                                    |

### `registration_disciplines` _(nur bei `type = 'ladv'`)_

| Spalte             | Typ                              | Beschreibung                                          |
|--------------------|----------------------------------|-------------------------------------------------------|
| id                 | text PK                          | UUID                                                  |
| registration_id    | text FK → registrations.id       | CASCADE DELETE                                        |
| discipline         | text NOT NULL                    | aus `wettbewerbe.disziplinNew`                        |
| age_class          | text NOT NULL                    | aus `wettbewerbe.klasseNew`                           |
| ladv_registered_at | integer (timestamp)              | wann Kevin diese Disziplin bei LADV angemeldet hat    |
| ladv_registered_by | text                             | Coach-Name                                            |
| ladv_canceled_at   | integer (timestamp)              | wann Kevin diese Disziplin bei LADV abgemeldet hat    |
| ladv_canceled_by   | text                             | Coach-Name                                            |
| createdAt          | integer (timestamp) NOT NULL     |                                                       |
| UNIQUE             |                                  | (registration_id, discipline)                         |

### `event_comments`

| Spalte    | Typ                          | Beschreibung                        |
|-----------|------------------------------|-------------------------------------|
| id        | text PK                      | UUID                                |
| event_id  | text FK → events.id          |                                     |
| user_id   | text FK → users.id           |                                     |
| type      | text NOT NULL                | `comment` \| `announcement`         |
| body      | text NOT NULL                |                                     |
| createdAt | integer (timestamp) NOT NULL |                                     |
| updatedAt | integer (timestamp) NOT NULL |                                     |

### `reactions` _(Bonus-Feature, Datenmodell vorbereitet)_

| Spalte     | Typ                          | Beschreibung           |
|------------|------------------------------|------------------------|
| id         | text PK                      | UUID                   |
| comment_id | text FK → event_comments.id  |                        |
| user_id    | text FK → users.id           |                        |
| emoji      | text NOT NULL                | z.B. `"👍"`, `"🔥"`   |
| createdAt  | integer (timestamp) NOT NULL |                        |
| UNIQUE     |                              | (comment_id, user_id, emoji) |

---

### `users`

| Spalte               | Typ                              | Beschreibung                                                   |
|----------------------|----------------------------------|----------------------------------------------------------------|
| id                   | text PK                          | UUID                                                           |
| email                | text NOT NULL UNIQUE             |                                                                |
| firstName            | text                             |                                                                |
| lastName             | text                             |                                                                |
| role                 | text DEFAULT `member`            | `member` \| `admin` \| `superuser`                            |
| campaiId             | text UNIQUE                      | Campai-interne ID                                              |
| membershipNumber     | text                             |                                                                |
| membershipStatus     | text DEFAULT `inactive`          | `active` \| `inactive`                                        |
| membershipEnterDate  | integer (timestamp)              |                                                                |
| membershipLeaveDate  | integer (timestamp)              |                                                                |
| sections             | text (JSON → string[])           | Abteilungszugehörigkeit aus Campai                             |
| lastSyncedAt         | integer (timestamp)              | letzter Campai-Sync                                            |
| avatarUrl            | text                             |                                                                |
| has_ladv_startpass   | integer (boolean) DEFAULT 0      | aus Campai-Sync (F-21); required für LADV-Event-Anmeldung      |
| createdAt            | integer (timestamp) NOT NULL     |                                                                |


### `auth_tokens`

| Spalte    | Typ                          | Beschreibung                                     |
|-----------|------------------------------|--------------------------------------------------|
| token     | text PK                      | zufälliger UUID-Token, per E-Mail versandt        |
| userId    | text FK → users.id           | CASCADE DELETE                                   |
| expiresAt | integer (timestamp) NOT NULL | 15 Minuten TTL                                   |
