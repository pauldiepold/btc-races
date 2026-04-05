# Schritt 9 — Implementierungsplan

_Stand: 2026-04-02_

---

## Wie dieser Plan zu nutzen ist

Jede Session bekommt dieses Dokument + die verlinkten Kontext-Files als Einstieg.  
Sessions sind sequenziell — jede baut auf dem Output der vorherigen auf.  
Abgeschlossene Sessions werden hier als ✅ markiert.

**Kontext-Files für alle Sessions:** `CLAUDE.md`, `planning/02b-datenmodell-entwurf.md`, `planning/03-feature-spec.md`, `planning/07-route-map.md`

**Nach jeder Session:**
1. Tests ausführen: `/test` (Claude Code) bzw. `@.cursor/rules/testing.mdc` (Cursor) aufrufen
2. Wenn Tests grün: committen (alle Änderungen der Session in einem Commit)
3. Abschnitt im Plan mit ✅ markieren, Inhalt erhalten, kurze Abschluss-Notiz (`**Abschluss:**`) am Ende des Abschnitts ergänzen

**Branch:** Alle Arbeiten auf `develop`. Kein Feature-Branch-Workflow nötig.

---

## Abhängigkeitsübersicht

```
9.1 Schema
  └── 9.2.1 Campai-Sync Rollen
        └── 9.2.2 Auth-Middleware
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

### ✅ 9.1 — DB-Schema finalisieren

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

**Abschluss (2026-04-04):** Alles reibungslos durchgelaufen. Migration `0002_thick_micromacro.sql` generiert und angewendet (8 Tabellen). `shared/types/db.ts` mit allen `$inferSelect`-Typen angelegt. `has_ladv_startpass` aus Campai-Feld `custom.1EAOnH99nXTTRrmreBYuF` befüllt, Typ im Service ergänzt. TypeCheck sauber (Exit 0).

---

### ✅ 9.2.1 — Campai-Sync: Rollen-Zuweisung erweitern

**Ziel:** Der Campai-Sync-Task setzt die `role` auf Basis der Campai-Sections korrekt. Admin-Section ist `"Coaches"`. Superuser wird per E-Mail hartcodiert.

**Hintergrund / Kontext:**

- `role` ist das authorative Feld in der `users`-Tabelle: `'member' | 'admin' | 'superuser'`
- Die Zuordnung erfolgt ausschließlich beim Campai-Sync — nie manuell über die UI
- `sections` bleibt als Array im User erhalten (wird in der Session mitgeführt), ist aber nicht mehr die Quelle für Zugriffsrechte
- `server/utils/sections.ts` enthält `ADMIN_SECTIONS = ['Vorstand', 'Geschäftsstelle']` — das ist veraltet und muss auf `['Coaches']` geändert werden

**Was zu tun ist:**

1. **`server/utils/sections.ts`** — `ADMIN_SECTIONS` auf `['Coaches']` ändern:
   ```ts
   export const ADMIN_SECTIONS = ['Coaches']
   ```

2. **`server/tasks/sync-members.ts`** — Superuser-Logik ergänzen. Nach der bestehenden `isAdminSection`-Prüfung:
   ```ts
   // Bestehende Zeile (bleibt):
   const role = sections.some(s => isAdminSection(s)) ? 'admin' as const : 'member' as const
   // Danach überschreiben wenn Superuser-E-Mail:
   const finalRole = email === 'paul@diepold.de' ? 'superuser' as const : role
   ```
   `finalRole` statt `role` in `userData` verwenden.

3. **`planning/07-route-map.md`** — Abschnitt „Rollen-Zuweisung" ergänzen (dokumentiert die Logik für zukünftige Entwickler)

**Hinweis zu `membershipStatus`:** Der Sync setzt bereits korrekt `membershipStatus: 'inactive'` für ausgetretene Mitglieder. Die Login-Sperre dafür folgt in 9.2.2.

**Output:** Campai-Sync setzt `role` korrekt (`member` / `admin` / `superuser`)  
**Kontext-Files:** `server/tasks/sync-members.ts`, `server/utils/sections.ts`, `planning/07-route-map.md`

**Abschluss (2026-04-04):** `ADMIN_SECTIONS` auf `['Coaches']` geändert, Superuser-Logik (`paul@diepold.de`) im Sync-Task ergänzt. Abschnitt „Rollen-Zuweisung" in `07-route-map.md` war bereits vollständig vorhanden. TypeCheck sauber.

---

### ✅ 9.2.2 — Auth-Middleware & Rollenprüfung

**Ziel:** Vollständige, konsistente Auth-Absicherung aller API-Routen. Wiederverwendbare Role-Guard-Utilities für alle weiteren Sessions.

**Hintergrund / Kontext:**

Es gibt zwei separate Auth-Schichten:
- **Server-Middleware** (`server/middleware/auth.ts`): prüft nur *ob* eine Session vorhanden ist. Momentan schützt sie nur `/events/` — das ist unvollständig.
- **In-Route-Guards** (`server/utils/auth.ts`, neu): prüfen die *Rolle*. Werden direkt in API-Routen aufgerufen.

`/api/cron/` wird **nicht** in der globalen Middleware abgesichert — der Bearer-Token-Check bleibt im Route-Handler (`server/api/cron/sync-members.ts`), weil Cron-Aufrufe keine Session haben.

Der bestehende `server/utils/sections.ts` enthält ein Guard-Pattern (`requireSection` etc.) als Referenz — die neuen Guards folgen demselben Muster, basieren aber auf `role` statt `sections`.

**Was zu tun ist:**

1. **`shared/types/auth.d.ts`** — `role: string` auf Union-Type ändern:
   ```ts
   role: 'member' | 'admin' | 'superuser'
   ```
   Datei liegt unter `shared/types/auth.d.ts`, `declare module '#auth-utils'`-Block.

2. **`server/middleware/auth.ts`** — ~~Whitelist-Ansatz~~ → **Blacklist-Ansatz** (Abweichung vom ursprünglichen Plan, Begründung: Whitelist müsste bei jeder neuen Route manuell gepflegt werden; Blacklist schützt neue Routen automatisch):
   ```ts
   const publicPaths = ['/api/auth/', '/api/cron/']
   // Alles andere unter /api/ → requireUserSession()
   ```
   Nur Session-Präsenz prüfen (`requireUserSession`), keine Rollen-Prüfung hier.

3. **`server/utils/auth.ts`** (neu anlegen) — drei Guards:
   - `requireAdmin(event)` — wirft 403 wenn `role !== 'admin' && role !== 'superuser'`
   - `requireSuperuser(event)` — wirft 403 wenn `role !== 'superuser'`
   - `requireOwnerOrAdmin(event, ownerId: string)` — wirft 403 wenn `session.user.id !== ownerId` und nicht admin/superuser
   
   Alle drei rufen intern `requireUserSession(event)` auf und lesen `session.user.role`.

4. **`app/middleware/auth.global.ts`** — Rollen-Redirects ergänzen:
   - `/admin` und alles darunter → redirect zu `/` wenn `role !== 'admin' && role !== 'superuser'`
   - `/superuser` und alles darunter → redirect zu `/` wenn `role !== 'superuser'`
   - Session-Objekt via `useUserSession()` verfügbar, `user.role` lesen

5. **`server/api/auth/login.post.ts`** — Login-Sperre für inaktive Mitglieder:
   - Nach dem `user`-Lookup: wenn `user.membershipStatus !== 'active'` → gleiche Response wie "User nicht gefunden" zurückgeben (kein Status-Leak nach außen)
   - Die Datei liegt in `server/api/auth/login.post.ts`, der relevante Block beginnt nach `if (!user) { ... }`

6. **`/verify`-Route** — ebenfalls Inactive-Check:
   - Route liegt unter `server/routes/verify.get.ts` oder ähnlich (vor der Session mit `setUserSession` aufrufen)
   - Wenn Token valid aber `user.membershipStatus !== 'active'` → 403 mit sprechender Fehlermeldung

**Output:** Alle API-Routen session-geschützt, Role-Utilities einsatzbereit, Frontend-Routen rollen-gesichert, inaktive Member können sich nicht einloggen  
**Kontext-Files:** `server/middleware/auth.ts`, `server/utils/sections.ts` (als Muster), `app/middleware/auth.global.ts`, `shared/types/auth.d.ts`, `server/api/auth/login.post.ts`, `planning/07-route-map.md`

**Abschluss (2026-04-04):** Alle 6 Punkte umgesetzt. `role` in `auth.d.ts` auf Union-Type. Server-Middleware auf Blacklist-Ansatz umgestellt (statt Whitelist — neue Routen sind automatisch geschützt). `server/utils/auth.ts` mit `requireAdmin`, `requireSuperuser`, `requireOwnerOrAdmin` neu angelegt. Frontend-Middleware um Rollen-Redirects für `/admin` und `/superuser` erweitert. Login-Sperre und Verify-Sperre für inaktive Mitglieder implementiert. TypeCheck sauber (Exit 0). Kleiner Fix: `user.role ?? ''` in `verify.get.ts` auf `?? 'member'` geändert, da `''` nicht mehr zum Union-Type passt.

---

### ✅ 9.3 — LADV-API-Client

**Ziel:** Wiederverwendbarer Service für LADV-API-Zugriffe. Wird vom Seeding (9.4) und vom Event-Backend (9.5/9.7) genutzt.

**Was zu tun ist:**

1. `pnpm api:generate` ausführen — TypeScript-Typen aus `server/external-apis/schemas/ladv-api-schema.json` generieren

2. `server/external-apis/ladv/ladv.service.ts` anlegen:
   - `fetchAusschreibung(ladvId: number)` — ruft `GET /ausDetail` auf, gibt normalisiertes Objekt zurück
   - Normalisierung: aus LADV-Response die Felder `name`, `date`, `location`, `registration_deadline`, `announcement_link` extrahieren (Mapping LADV-Feldnamen → App-Feldnamen dokumentieren)
   - `parseLadvIdFromUrl(url: string): number | null` — extrahiert LADV-ID aus Ausschreibungslink
   - Fehlerbehandlung: API nicht erreichbar → sprechenden Fehler werfen (wird im Seeding als Fallback-Signal genutzt)

3. (Optional) Fixture-Format festlegen: gecachte LADV-Response als JSON unter `server/db/seed/ladv-fixtures/[id].json`

**Testbare Logik (→ `/test` nach der Session):**
- `parseLadvIdFromUrl` — pure Funktion, gehört in `server/utils/ladv.ts` (nicht ins Service), damit sie importierbar und testbar ist. Test-Cases: gültige URL mit ID, ungültige URL, `null`-Rückgabe.
- Normalisierungslogik (LADV-Felder → App-Felder) — wenn als eigene Funktion `normalizeLadvData(raw)` extrahiert, ebenfalls testbar.

**Output:** `server/external-apis/ladv/ladv.service.ts` einsatzbereit, Typen generiert  
**Kontext-Files:** `server/external-apis/schemas/ladv-api-schema.json`, `server/external-apis/campai-contacts/contacts.service.ts` (als Referenz für Service-Muster)

**Abschluss (2026-04-04):** `LadvService` als schlanke Klasse (analog Campai-Pattern), `normalizeLadvData` + `parseLadvIdFromUrl` als testbare pure Funktionen in `server/utils/ladv.ts`. Interfaces gegen echte API-Response (ID 45980) geprüft. `openapi-typescript` + `openapi-fetch` komplett entfernt (Deps, Script, generated-Ordner, OpenAPI-Schemas) — generierter Output war unvollständig und verursachte Typ-Fehler. `ladvApiKey` in `runtimeConfig` ergänzt. TypeCheck sauber (Exit 0).

---

### ✅ 9.4 — Dev-Seeding (F-25)

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
| `registered` + `ladv_registered_at` null | Paul angemeldet, Disziplin gewählt, noch nicht bei LADV eingereicht (E-03-Ausgangszustand) |
| `registered` + `ladv_registered_at` gesetzt | Kevin hat bereits bei LADV angemeldet |
| `canceled` + `ladv_registered_at` gesetzt | Abgesagt nach LADV-Meldung |
| `canceled` + `ladv_registered_at` + `ladv_canceled_at` | Vollständiger LADV-Abmelde-Flow (Admin) |
| Anmeldung < 3 Tage vor Meldefrist | E-05-Trigger testbar |
| Anmeldung ohne Startpass bei LADV-Event | F-22-Flow testbar |

**Output:** `pnpm db:seed` läuft durch, alle Features explorierbar  
**Kontext-Files:** `server/tasks/sync-members.ts`, `server/external-apis/ladv/ladv.service.ts`, `02b-datenmodell-entwurf.md`

**Abschluss (2026-04-04):** `@faker-js/faker` (de-Locale) als Dev-Dependency ergänzt. `pnpm db:seed` via `nuxi task:run seed` in package.json. Fixture-Ansatz umgekehrt zum Plan: JSONs in `server/db/seed/ladv-fixtures/[id].json` sind Primary, LADV-API ist Fallback — beim ersten Lauf werden Fixtures automatisch gespeichert. 13 LADV-IDs aktiv, 6 auskommentiert (jede 3.). Alle 6 Seeding-Schritte implementiert inkl. aller hardcodierten Szenarien: E-03 (ausstehend + bereits eingereicht), E-04, E-05, F-22. Campai-User-Check (min. 50) als Abbruchbedingung.

---

### ✅ 9.5.1 — Schema-Erweiterung: Zusätzliche Event-Felder

**Ziel:** Fehlende Felder aus v1-Analyse in Schema + Feature-Spec + Datenmodell nachziehen, bevor 9.5 implementiert wird.

**Hintergrund / Kontext:**

Beim Vergleich mit v1 und der LADV-API-Antwort wurden folgende fehlende Felder identifiziert. Diese müssen vor der API-Implementierung (9.5 Backend) im Schema vorhanden sein, damit Validierungsschemas, Normalisierung und Tests in einem Zug geschrieben werden können.

**Entschiedene Nicht-Normalisierungen:**
- Altersklassen (`jugend`, `aktive`, `masters` aus `ladv_data.kategorien`) werden **nicht** als eigene Spalten gespeichert. Die Info ist über `ladv_data.wettbewerbe` abrufbar und nur für LADV-Events relevant. Ein entsprechender Filter kann in einer späteren Version nachgezogen werden.
- `race_type` wird **nicht** aus `ladv_data.kategorien` automatisch für alle Events gesetzt — nur beim LADV-Import (s.u.).

**Was zu tun ist:**

**1. `server/db/schema.ts` — 4 Spalten zur `events`-Tabelle ergänzen:**

```ts
description: text('description'),                 // nullable — Freitext für alle Event-Typen
raceType: text('race_type'),                       // nullable — 'track' | 'road'
championshipType: text('championship_type'),       // nullable — 'none' | 'bbm' | 'ndm' | 'dm'
isWrc: integer('is_wrc').notNull().default(0),     // Boolean-Flag (World Ranking Competition)
```

**2. Migration generieren und anwenden:**
```bash
pnpm db:generate
pnpm db:migrate
```

**3. `server/utils/ladv.ts` — `normalizeLadvData` anpassen:**

`NormalizedLadvData` um die neuen Felder erweitern und beim Import befüllen:

```ts
// race_type: 'bahn' in raw.kategorien → 'track', sonst 'road'
race_type: raw.kategorien.includes('bahn') ? 'track' : 'road',
// is_wrc: aus raw.wrc (boolean → 0|1)
is_wrc: raw.wrc ? 1 : 0,
// championship_type: bei LADV nicht in der API — bleibt null
championship_type: null,
```

`isWrc` im Interface ist `wrc?: boolean` (optional, da nicht immer vorhanden) → mit `?? false` absichern.

**4. `planning/02b-datenmodell-entwurf.md` — Events-Tabelle aktualisieren:**

Die 4 neuen Spalten in der Tabellendokumentation ergänzen, inkl. kurzer Beschreibung wann sie gesetzt werden.

**5. `planning/03-feature-spec.md` — Filter-Dokumentation ergänzen:**

In F-01 (Event-Liste): Filter um `raceType` und `championshipType` ergänzen. Vermerken dass diese Filter nur für Events mit gesetzten Werten relevant sind (hauptsächlich `competition` und `ladv`).

**6. Seed anpassen (`server/tasks/seed.ts`):**

Bei den generierten `competition`-Events (Schritt 5 im Seeder) `raceType` und `championshipType` mit Faker-Werten befüllen, damit die Filter lokal testbar sind. Beispiel:
```ts
raceType: faker.helpers.arrayElement(['track', 'road']),
championshipType: faker.helpers.arrayElement(['none', 'bbm', 'ndm', 'dm']),
```

Bei LADV-Events: `raceType` und `isWrc` kommen automatisch aus `normalizeLadvData` — kein manueller Seeder-Eingriff nötig.

**Output:** Schema migriert, `normalizeLadvData` befüllt neue Felder, Seed funktioniert, Doku aktuell  
**Kontext-Files:** `server/db/schema.ts`, `server/utils/ladv.ts`, `server/tasks/seed.ts`, `planning/02b-datenmodell-entwurf.md`, `planning/03-feature-spec.md`

**Abschluss (2026-04-05):** Migration `0003_amused_siren.sql` generiert und angewendet (events-Tabelle jetzt 18 Spalten). `NormalizedLadvData` um `race_type`, `is_wrc`, `championship_type` erweitert; `normalizeLadvData` befüllt diese aus `raw.kategorien` bzw. `raw.wrc`. Seed: LADV-Insert übergibt die neuen Felder, competition-Events erhalten Faker-Werte für `raceType`/`championshipType`. Doku in `02b-datenmodell-entwurf.md` und F-01 in `03-feature-spec.md` aktualisiert. TypeCheck sauber (Exit 0).

---

### ✅ 9.5 — Event-Anlegen + Liste (F-01, F-07, F-08)

**Ziel:** Events anlegen (manuell + LADV-Import) und als Liste anzeigen. Erste vollständige Seite der App mit echten Daten aus dem Seed.

**Was zu tun ist:**

**Backend:**
- `GET /api/events` — Liste mit Filtern: `type`, `timeRange` (upcoming/past/all), sortiert nach Datum. Eigener Anmeldestatus (join auf `registrations`) wird mitgeliefert.
- `POST /api/events` — Neues Event anlegen (`competition`, `training`, `social`). Pflichtfelder validieren, `created_by` setzen.
- `POST /api/events/ladv-import` — LADV-ID aus URL parsen (LADV-Service), Duplikat-Check (`ladv_id` bereits vorhanden?), normalisierte Felder + `ladv_data` speichern. Redirect-URL in Response zurückgeben.

**Backend-Abschluss (2026-04-05):**
- `GET /api/events` — Query-Params: `?type=ladv|competition|training|social` (optional), `?timeRange=upcoming|past|all` (default: `upcoming`). Einzel-Query mit LEFT JOIN + SQL-Aggregation: `participantCount` (non-canceled), `ownRegistrationStatus`, `ownRegistrationId`. `ladvData` nicht in der Liste. Sortierung: `date ASC`, Events ohne Datum am Ende.
- `POST /api/events` — Body: `{ type, name, date?, location?, description?, registrationDeadline?, announcementLink?, raceType?, championshipType? }`. Dates als YYYY-MM-DD-String. Response: erstelltes Event-Objekt.
- `POST /api/events/ladv-import` — Body: `{ url }`. Duplikat → HTTP 409 mit `data: { existingEventId }`. LADV-API-Fehler → HTTP 502. Success → 201 mit vollem Event-Objekt (inkl. `ladvData`).

---

**Frontend (nächster Chat):**

**Voraussetzungen:**
- `app/pages/events.vue` existiert bereits als Stub (nur Placeholder-Text)
- Nuxt UI v4, Primary: `yellow`, Neutral: `zinc`, Dark Mode, Font: Space Grotesk (`font-display`)
- Auth-Pattern: `useUserSession()` → `session.user` für Rolle/ID; `$fetch` für API-Calls (wie in `login.vue`)
- Toast-Pattern: `const toast = useToast()` → `toast.add({ title, description, color })`
- Navigation: `navigateTo('/events/[id]')`
- Error-Handling aus `$fetch`: `FetchError` mit `.data.existingEventId` für 409-Fälle

**Shared Type anlegen (`shared/types/events.ts`):**

```ts
import type { Event } from './db'

// Erweiterter Typ für die Listen-Response (ohne ladvData, mit aggregierten Feldern)
export type EventListItem = Omit<Event, 'ladvData'> & {
  participantCount: number
  ownRegistrationStatus: string | null
  ownRegistrationId: string | null
}
```

---

**Seite 1: `/events` — `app/pages/events.vue`**

Datenabruf:
```ts
// Server-seitige Filter an die API übergeben
const typeFilter = ref<string | undefined>(undefined)
const timeRange = ref<'upcoming' | 'past' | 'all'>('upcoming')

const { data: events } = await useFetch<EventListItem[]>('/api/events', {
  query: computed(() => ({
    type: typeFilter.value,
    timeRange: timeRange.value,
  })),
})
```

Client-seitige Filter (auf dem geladenen Array):
```ts
const raceTypeFilter = ref<'track' | 'road' | undefined>(undefined)
const championshipTypeFilter = ref<string | undefined>(undefined)
const isWrcOnly = ref(false)
const searchQuery = ref('')

const filteredEvents = computed(() => {
  return (events.value ?? []).filter(e => {
    if (raceTypeFilter.value && e.raceType !== raceTypeFilter.value) return false
    if (championshipTypeFilter.value && e.championshipType !== championshipTypeFilter.value) return false
    if (isWrcOnly.value && !e.isWrc) return false
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      return e.name.toLowerCase().includes(q) || e.location?.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q)
    }
    return true
  })
})
```

Filter-UI-Logik:
- `type`-Filter und `timeRange` → Änderung triggert neuen API-Call (via `useFetch` mit reactive `query`)
- `raceType`, `championshipType`, `isWrc`, Freitextsuche → client-seitig auf `events.value`
- Filter für `raceType`/`championshipType` nur anzeigen wenn mind. ein Event mit gesetztem Wert vorhanden ist (sonst sinnlos)
- Vergangene Events: `timeRange`-Toggle "Vergangene anzeigen" (setzt `timeRange = 'past'`)

Event-Card pro Event (Inline oder als `app/components/EventCard.vue`):
- Typ-Badge: `ladv` → blau, `competition` → gelb, `training` → grün, `social` → lila (Nuxt UI `UBadge` mit `color`)
- WRC-Badge: kleines `i-ph-trophy` Icon + "WRC" wenn `isWrc === 1`
- Meldefrist: nur bei `competition` und `ladv` anzeigen; rot wenn abgelaufen (`registrationDeadline < now`)
- Abgesagt-Overlay: halbtransparentes Badge "Abgesagt" wenn `cancelledAt` gesetzt
- Eigener Anmeldestatus: Icon/Badge wenn `ownRegistrationStatus` nicht null
- `participantCount` anzeigen (z.B. "5 Anmeldungen")
- Link → `/events/[id]`

Aktions-Buttons (oben rechts):
- "LADV importieren" → `/events/ladv-importieren`
- "Event erstellen" → `/events/neu`

---

**Seite 2: `/events/neu` — `app/pages/events/neu.vue`**

Formular mit Nuxt UI `UForm` + Zod-Schema (client-seitig spiegelt Server-Schema):
```ts
const schema = z.object({
  type: z.enum(['competition', 'training', 'social']),
  name: z.string().min(1),
  date: z.string().date().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  registrationDeadline: z.string().date().optional(),
  announcementLink: z.string().url().optional().or(z.literal('')),
  raceType: z.enum(['track', 'road']).optional(),
  championshipType: z.enum(['none', 'bbm', 'ndm', 'dm']).optional(),
})
```

Felder:
- `type` — `USelect` mit Optionen: Competition / Training / Social (ladv nicht wählbar)
- `name` — `UInput`, required
- `date` — `UInput type="date"` (YYYY-MM-DD, browser date picker)
- `location` — `UInput`, optional
- `description` — `UTextarea`, optional
- `registrationDeadline` — `UInput type="date"`, nur anzeigen wenn `type === 'competition'`
- `announcementLink` — `UInput type="url"`, optional
- `raceType` — `USelect` (Bahn / Straße), nur bei `competition`
- `championshipType` — `USelect` (Keine / BBM / NDM / DM), nur bei `competition`

Submit:
```ts
async function onSubmit() {
  const created = await $fetch('/api/events', { method: 'POST', body: formData })
  await navigateTo(`/events/${created.id}`)
}
```
Fehler → Toast.

---

**Seite 3: `/events/ladv-importieren` — `app/pages/events/ladv-importieren.vue`**

Einfaches Formular: ein URL-Input + Submit-Button.

Fehlerbehandlung bei 409 (Duplikat):
```ts
try {
  const created = await $fetch('/api/events/ladv-import', { method: 'POST', body: { url } })
  await navigateTo(`/events/${created.id}`)
} catch (err) {
  if (err.status === 409 && err.data?.existingEventId) {
    toast.add({ title: 'Event bereits vorhanden', description: 'Du wirst zur bestehenden Veranstaltung weitergeleitet.', color: 'warning' })
    await navigateTo(`/events/${err.data.existingEventId}`)
  } else if (err.status === 502) {
    toast.add({ title: 'LADV nicht erreichbar', description: err.statusMessage, color: 'error' })
  } else {
    toast.add({ title: 'Fehler', description: err.message, color: 'error' })
  }
}
```

Hinweis: `$fetch` bei 4xx/5xx wirft einen `FetchError` mit `.status`, `.statusMessage` und `.data` — kein zusätzliches try-catch nötig für den Erfolgsfall.

**Output:** Events anlegen und listen funktioniert  
**Kontext-Files:** `03-feature-spec.md` (F-01, F-07, F-08), `07-route-map.md`, `shared/types/db.ts`, `app/pages/login.vue` (Pattern-Referenz), `app/app.config.ts` (Design-System)

**Abschluss Backend (2026-04-05):** Drei Endpunkte implementiert. `GET /api/events`: LEFT JOIN + SQL-Aggregation in einem Query, 2 server-seitige Params (`type`, `timeRange`). `POST /api/events`: Zod-Validierung, YYYY-MM-DD → Date, alle neuen Schema-Felder berücksichtigt. `POST /api/events/ladv-import`: parseLadvIdFromUrl, Duplikat-Check mit 409+existingEventId, LadvService-Fehler als 502. TypeCheck Exit 0. Frontend folgt im nächsten Chat.

**Abschluss Review (2026-04-05):** POST-Routen nach Review vereinfacht: beide geben nur `{ id }` + 201 zurück statt vollem Event-Objekt — Frontend navigiert zur Detailseite und fetcht selbst. CLAUDE.md um Typecheck-Hinweis (Exit-Code) ergänzt.

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

**Testbare Logik (→ `/test` nach der Session):**
- LADV-Diff-Erkennung — `detectLadvDiff(event, ladvData)` als pure Funktion in `shared/utils/ladv.ts` extrahieren (wird sowohl im Frontend für den Diff-Hinweis als auch ggf. im Backend genutzt). Gibt ein Objekt mit abweichenden Feldern zurück. Test-Cases: keine Abweichung, einzelne Felder abweichend, alle Felder gleich trotz unterschiedlicher Typen (z.B. Date vs. String).

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

**Testbare Logik (→ `/test` nach der Session):**
- State Machine — `getValidNextStatuses(currentStatus, eventType)` in `shared/utils/registration.ts` extrahieren. Wird im Frontend (welche Buttons anzeigen) und im Backend (Validierung beim PATCH) gleichermaßen gebraucht. Test-Cases: alle Kombinationen aus `03-feature-spec.md`, ungültige Übergänge.
- Fristprüfung — `isDeadlineExpired(deadline: Date | null, now?: Date): boolean` in `shared/utils/deadlines.ts`. Test-Cases: abgelaufene Frist, noch offene Frist, `null` (kein Deadline-Check nötig), exakte Grenze.

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
