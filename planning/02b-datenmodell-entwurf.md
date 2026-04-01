# Schritt 2.2 — Datenmodell-Entwurf

_Abgestimmt am 2026-03-31_

---

## Entscheidungen (ADR-Format)

---

### ADR-001: Event-Typen — eine Tabelle

**Entscheidung:** Eine `events`-Tabelle mit `type`-Feld (`ladv` | `competition` | `training`). Typ-spezifische Felder sind nullable.

Es gibt vier konzeptuelle Event-Typen: LADV-Wettkampf, normaler Wettkampf, Training und sonstige Teamevents (Ausflüge etc.). Training und Teamevents verhalten sich identisch (freiwillige Teilnahme, kein Admin-Bestätigungsschritt) und werden vorerst unter `training` zusammengefasst. Spätere Feindifferenzierung ist möglich — das `type`-Feld ist ein Text-Feld, weitere Werte können jederzeit ergänzt werden.

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

### ADR-004: Disziplinen & Altersklassen

**Entscheidung:** Keine eigene `event_disciplines`-Tabelle. Die `wettbewerbe`-Liste aus `ladv_data` wird zur Laufzeit gelesen und als Select im Anmeldeformular gerendert. Der Athlet wählt immer eine Kombination (`disziplinNew` + `klasseNew`). In `registrations` werden `discipline` und `age_class` als separate nullable Text-Spalten gespeichert.

Für nicht-LADV-Events: `discipline` und `age_class` sind nullable. Manuelle Disziplin-Listen bei normalen Wettkämpfen sind optional — bei Bedarf als `disciplines` JSON-Feld an `events` ergänzbar, kein Aufwand jetzt.

**Begründung:** `wettbewerbe` wird nur einmal pro Anmeldevorgang gelesen, kein Queryingbedarf. Altersklassen kommen immer aus der LADV-Kombination — kein Freitext, kein Auto-Calc aus Geburtsdatum (zu komplex für v2).

**Konsequenzen:** Bei LADV-Events: beide Felder required (App-Validierung). Bei Training: beide null.

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

### ADR-006: Kommentare & Ankündigungen

**Entscheidung:** Eine `event_comments`-Tabelle mit `type`-Feld (`comment` | `announcement`). Announcements werden im Frontend oben gepinnt — reine UI-Logik. Emoji-Reaktionen als Bonus-Feature: eigene `reactions`-Tabelle mit FK auf `event_comments.id`.

**Begründung:** Beide Typen haben identische Felder. Eine Tabelle vermeidet Duplikation und vereinfacht Queries (z.B. "alle Kommentare + Announcements für ein Event"). `reactions` als separate Tabelle ist später einfach anhängbar.

**Konsequenzen:** Beim Anzeigen nach `type` filtern/sortieren (Announcements immer oben).

---

## Beschlossenes Schema

### `events`

| Spalte                | Typ                              | Beschreibung                                      |
|-----------------------|----------------------------------|---------------------------------------------------|
| id                    | text PK                          | UUID                                              |
| type                  | text NOT NULL                    | `ladv` \| `competition` \| `training`             |
| name                  | text NOT NULL                    |                                                   |
| date                  | integer (timestamp) NOT NULL     |                                                   |
| location              | text                             |                                                   |
| registration_deadline | integer (timestamp)              | null bei training                                 |
| announcement_link     | text                             |                                                   |
| cancelled_at          | integer (timestamp)              | gesetzt beim Sync wenn LADV `abgesagt: true`      |
| ladv_id               | integer                          | nur bei type=ladv                                 |
| ladv_data             | text (JSON)                      | Rohdaten LADV-API inkl. wettbewerbe-Liste         |
| ladv_last_sync        | integer (timestamp)              |                                                   |
| created_by            | text FK → users.id               |                                                   |
| createdAt             | integer (timestamp) NOT NULL     |                                                   |
| updatedAt             | integer (timestamp) NOT NULL     |                                                   |

### `registrations`

| Spalte              | Typ                          | Beschreibung                                           |
|---------------------|------------------------------|--------------------------------------------------------|
| id                  | text PK                      | UUID                                                   |
| event_id            | text FK → events.id          |                                                        |
| user_id             | text FK → users.id           |                                                        |
| status              | text NOT NULL                | `registered`\|`canceled`\|`maybe` (ladv+competition), `yes`\|`no`\|`maybe` (training) |
| discipline          | text                         | aus wettbewerbe.disziplinNew; null bei training        |
| age_class           | text                         | aus wettbewerbe.klasseNew; null bei training           |
| notes               | text                         | Freitext-Hinweis des Mitglieds an Admins               |
| ladv_registered_at  | integer (timestamp)          | wann Kevin bei LADV angemeldet hat                     |
| ladv_registered_by  | text                         | Coach-Name                                             |
| ladv_canceled_at    | integer (timestamp)          | wann Kevin bei LADV abgemeldet hat                     |
| ladv_canceled_by    | text                         | Coach-Name                                             |
| createdAt           | integer (timestamp) NOT NULL |                                                        |
| updatedAt           | integer (timestamp) NOT NULL |                                                        |
| UNIQUE              |                              | (event_id, user_id)                                    |

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

## Bereits vorhandene Tabellen (unverändert)

- `users` — Campai-Sync, Magic-Link-Auth, `role`-Feld für Admin
- `auth_tokens` — Magic-Link-Tokens
