# Schritt 2.2 — Datenmodell-Entwurf: Kontext & Vorüberlegungen

Dieses File dient als vollständiger Kontext für den Datenmodell-Chat.
Ziel: Kernentscheidungen gemeinsam treffen, Output wird `02b-datenmodell-entwurf.md`.

---

## Projektkontext

**BTC Wettkampfanmeldung** — Wettkampf-Anmeldesystem für den Berlin Track Club.
Stack: Nuxt 4, Cloudflare D1 (SQLite) via NuxtHub, Drizzle ORM.
Schema liegt in `server/db/schema.ts`. Typen werden per `$inferSelect` geteilt.

Wichtig: SQLite (kein PostgreSQL) — kein JSONB-Typ, kein nativer Array-Typ, keine Enums auf DB-Ebene (nur als String + Check-Constraint oder rein in der App).

---

## Was bereits feststeht (aus Analyse v1 + Interview)

### Auth & User
- Magic-Link für alle Mitglieder (bereits implementiert in v2)
- Kein anonymer Flow — alles hinter Login
- User werden via Campai-API-Sync in `users`-Tabelle gehalten
- Admin-Rolle: boolean oder Campai-Attribut — noch offen, wird bei Implementierung entschieden

### Was v1 hatte (relevant fürs Schema)
- `competitions`: name, location, date, registration_deadline, announcement_link, registration_type (INDEPENDENT/LADV/CLUB), race_type (TRACK/ROAD), championship_type, ladv_id, ladv_data (JSON), ladv_last_sync, veranstalter, ausrichter, sportstaette, ladv_description
- `registrations`: member_id, competition_id, status (pending/confirmed/canceled/pending_cancellation), notes, ladv_registered_at, ladv_registered_by, ladv_canceled_at, ladv_canceled_by
- `competition_distances`: competition_id, distance — **angelegt aber nie genutzt**
- `sent_emails`: vollständiges E-Mail-Protokoll

---

## Die zentralen offenen Fragen fürs Datenmodell

### 1. Event-Typen: eine Tabelle oder mehrere?

Es gibt drei grundlegend verschiedene Event-Typen:

**LADV-Wettkampf**
- Hat eine externe LADV-Ausschreibungs-ID
- Daten kommen primär von der LADV-API (JSON-Blob)
- Bestimmte Felder doppeln sich mit dem eigenen Schema (Name, Datum, Location)
- Anmeldung mit Disziplin-Auswahl (aus LADV-Daten)
- Admin bestätigt nachträglich (nach manueller LADV-Meldung)
- Status: pending → confirmed / canceled
- Altersklasse: User-Input (kein Auto-Calc in v2)

**Normaler Wettkampf**
- Manuell angelegt, kein LADV-Bezug
- Einfacherer Flow, evtl. ohne Bestätigungsschritt
- Disziplinen: vermutlich manuell pflegbar

**Training / Vereinsevent** ← Can-Feature, aber Datenmodell vorbereiten
- Kein Wettkampf-Charakter
- Anmeldung freiwillig: Ja / Nein / Vielleicht
- Keine Admin-Bestätigung nötig
- Nur Sichtbarkeit: wer kommt?

**Optionen:**
- A) Eine `events`-Tabelle mit `type`-Feld, nullable Spalten je nach Typ
- B) Gemeinsame `events`-Basistabelle + separate Erweiterungstabellen per Typ (`ladv_event_data`, etc.)
- C) Separate Tabellen pro Typ (maximale Trennung, aber Duplikation)

### 2. LADV-Daten: JSON-Blob + was wird normalisiert?

Aus dem Interview: LADV-Rohdaten als JSON speichern.
Aber: Name, Datum, Location existieren auch in unserem Schema.

**Frage:** Welche Felder werden aus dem JSON normalisiert (eigene Spalten), welche bleiben nur im Blob?

Kandidaten für eigene Spalten (weil sie UI-seitig direkt gebraucht werden):
- `name`, `date`, `location`, `registration_deadline`
- `ladv_id`, `ladv_last_sync`
- `veranstalter`, `ausrichter` (nur LADV — evtl. in JSON lassen?)

Kandidaten für JSON-only:
- Disziplin-Liste (strukturiert, von LADV vorgegeben)
- Altersklassen-Codes
- Sonstige LADV-Metadaten

### 3. Feldpräzedenz: LADV vs. manuelle Überschreibung

Problem: Kevin könnte einen Wettkampf zuerst manuell anlegen, dann LADV-Daten importieren — oder umgekehrt. LADV-Daten könnten veralten. Admins wollen ggf. Namen/Datum korrigieren.

**Mögliche Ansätze:**
- A) LADV-Daten landen immer im JSON-Blob, App-Felder sind immer manuell (Admin kann überschreiben, kein Auto-Sync auf App-Felder)
- B) LADV-Import befüllt App-Felder initial, danach manuell überschreibbar (kein Re-Sync auf diese Felder)
- C) Explizites Override-Flag pro Feld (`name_override`, `date_override` etc.) — sehr granular, wahrscheinlich over-engineered
- D) Zwei Felder: `ladv_name` und `name` — App zeigt immer `name`, Admin kann wählen welches gesetzt wird

### 4. Disziplinen & Altersklassen

Bei LADV-Events: Die Ausschreibung enthält eine Liste möglicher Disziplinen (mit LADV-Codes).
Bei Anmeldung wählt der Athlet seine Disziplin aus dieser Liste.

**Fragen:**
- Wo werden die Disziplinen gespeichert? Im `ladv_data`-JSON oder eigene Tabelle `event_disciplines`?
- Brauchen wir eine eigene Tabelle, damit wir auf der Anmeldungsseite eine saubere Auswahl rendern können — oder reicht JSON-Parsing?
- Bei der Anmeldung (`registrations`): Spalte `discipline` (Text/Code) + `age_class` (Freitext)?

### 5. Registrierungs-Status je Event-Typ

| Event-Typ        | Mögliche Status                                      |
|------------------|------------------------------------------------------|
| LADV             | `pending` → `confirmed` / `canceled` / `pending_cancellation` |
| Wettkampf        | `registered` / `canceled` (kein Bestätigungsschritt?) |
| Training         | `yes` / `no` / `maybe`                               |

**Frage:** Ein gemeinsames `status`-Feld in `registrations` mit allen möglichen Werten, oder typ-spezifische Logik?

### 6. Kommentare & Ankündigungen

Zwei verschiedene Konzepte auf Events:

**Öffentliche Kommentare** (alle Mitglieder)
- Text, Autor (user_id), Timestamp
- Emoji-Reaktionen als Bonus-Feature (eigene Tabelle `reactions`?)

**Admin-Ankündigungen**
- Wie Kommentare, aber mit `is_announcement`-Flag oder eigene Tabelle?
- Immer oben gepinnt / hervorgehoben

**Option A:** Eine `event_comments`-Tabelle mit `type`-Feld (`comment` / `announcement`)
**Option B:** Separate Tabellen `event_comments` und `event_announcements`

---

## Referenz: Aktuelles v2-Schema (relevante Teile)

```
users: id, email, firstName, lastName, role, campaiId, avatarUrl, sections, isAdmin(?), createdAt, updatedAt
authTokens: id, userId, token, expiresAt, verifiedAt, createdAt
```

LADV-API-Typen sind bereits generiert (`server/external-apis/campai-contacts/`-ähnlich für LADV).
OpenAPI-Schemas liegen in `server/external-apis/schemas/`.

---

## Ziel des Datenmodell-Chats

Am Ende soll feststehen:
1. Tabellenstruktur für `events` (inkl. Typ-Entscheidung)
2. Wie LADV-Daten eingehängt werden und welche Felder normalisiert werden
3. Wo Disziplinen gespeichert werden
4. Struktur von `registrations` (Status-Modell, Disziplin/Altersklasse)
5. Struktur für Kommentare & Ankündigungen

Output: `02b-datenmodell-entwurf.md` mit beschlossenem Schema in Tabellenform + kurzen Begründungen je Entscheidung.
