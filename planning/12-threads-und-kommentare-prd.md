# PRD-Plan: Threads & Kommentare (Living Document)

> Stand: in Arbeit. Wird inkrementell während des Interviews ergänzt.
> Ziel: am Ende dieses Dokument als finales PRD via `gh issue create` einreichen.

## Context

Die App soll zwei größere neue Funktionsbereiche bekommen, die das Verhalten der bisherigen Campai-„Räume" in btc-races übernehmen und ablösen:

1. **Lineare Kommentare unter jedem Event** (Chat-ähnlich, eigene Kommentare editier-/löschbar, Avatare).
2. **Threads als eigener Bereich** mit verschiedenen Typen (z. B. Vorstandsinfo, Frage). Unterhalb jedes Threads wieder dieselben linearen Kommentare wie bei Events.
3. **Umfragen** werden mitgedacht, aber später umgesetzt.

Bestehende Substanz:
- `server/db/schema.ts`: `event_comments` (mit `type: 'comment' | 'announcement'`) und `reactions` existieren bereits, aber **kein** UI/Backend dafür.
- 3 offene Issues (Epic #21, Backend #12, Frontend #13) beschreiben den älteren, kleineren Plan (Comments + gepinnte Announcements im Event). Dieser Plan **ersetzt** die alten Issues konzeptionell.

## Architekturentscheidungen (Phase A — abgeschlossen)

### A1 — Datenmodell: vereinheitlicht über Threads (Variante iii)
- Eine Tabelle `threads`, eine Tabelle `comments` (FK `comments.threadId`).
- Jedes Event hat **1:1** einen Thread. Wird beim Anlegen des Events automatisch erzeugt (`threads.eventId` nullable unique FK).
- Migration: `event_comments` → `comments` + Auto-Thread-Erstellung für alle bestehenden Events.
- Vorteil: ein Service, ein Endpoint-Set, einheitliches UI. Nachteil (leere Thread-Hülle pro Event) ist akzeptabel, weil sie automatisch entsteht.

### A2 — Kein Comment-Typ; stattdessen Pinning
- Der `'announcement'`-Typ in `event_comments` wird ersatzlos entfernt.
- Kommentare bekommen ein `pinnedAt` (+ ggf. `pinnedBy`).
- Gepinnte Kommentare werden im Thread **oben** als eigener Block dargestellt; sie bleiben zusätzlich chronologisch im Stream.
- Anwendungsfall: Trainings-Event wird verschoben → Coach kommentiert mit Grund → der Kommentar wird gepinnt, damit er nicht zwischen anderen Kommentaren untergeht.
- Berechtigung zum Pinnen: TBD in Phase B (vorläufige Annahme: Admin + Thread/Event-Owner).

### A3 — Threads-Seite, chronologisch nach letzter Aktivität
- Eigene Route (vorläufig `/threads` oder `/community` — Name TBD).
- Sortierung: **letzte Aktivität absteigend** (neuer Kommentar pusht den Thread nach oben).
- Filter nach Typ (Vorstandsinfo, Frage, …).
- Event-Threads erscheinen in dieser Liste mit, sodass das Geschehen rund um Events organisch in den Stream einfließt.

### A4 — Berechtigungen pro Typ — vorerst aufgeschoben
- Schema soll es vorsehen (z. B. `threadType.requiredRole`-Mapping), aber initial darf jeder jeden Typ anlegen.
- Wird in einem Folge-Issue konkretisiert.

### A5 — Räume als Strukturierung (Campai-Analogie)
- Threads liegen in **Räumen** — Anlehnung an Campai:
  - Ankündigungen
  - Training (löst Trainings-Termine + Trainings-Rückfragen ab)
  - Team
  - Races (Wettkämpfe — `competition` und `ladv`)
  - Social / Team-Events (löst „Team-Events" ab; hier später auch Umfragen)
- Event-Threads landen automatisch im passenden Raum gemäß Event-Typ:
  - `training` → Training
  - `competition` / `ladv` → Races
  - `social` → Social
- Räume **können sektionsspezifisch** sein (Mapping auf `users.sections`). Details TBD in Phase C.
- Offene Frage in Phase C: Verhältnis **Raum** vs. **Thread-Typ** (eine Dimension oder zwei orthogonale).

## Phase B — Event-Kommentare / Stream-Verhalten (abgeschlossen)

### B1 — Reihenfolge & Eingabe
- **Event-Detail-Seite**: Stream **absteigend** (neueste oben), Eingabe **oben**. Kein Auto-Scroll — verhindert endloses Scrollen über LADV-Daten/Anmeldungen.
- **Thread-Detail-Seite**: Stream **aufsteigend** (älteste oben, neueste unten), Eingabe **sticky am unteren Rand**, Auto-Scroll an das Ende beim Öffnen. Klassischer Chat-Look.

### B2 — Edit
- Editieren **unbegrenzt** möglich.
- Marker `(bearbeitet)` am Kommentar wenn `updatedAt > createdAt`.
- Keine Edit-History (Original wird überschrieben).

### B3 — Delete (Soft-Delete mit Tombstone)
- Soft-Delete: Datensatz bleibt erhalten, Body wird **nicht** gelöscht (für Recovery), aber neu gesetztes `deletedAt` markiert ihn als entfernt.
- UI: zeigt statt Body „*Kommentar gelöscht*" (Tombstone).
- Edit/Delete-Aktionen am gelöschten Kommentar nicht mehr möglich.
- Wer darf löschen: eigener Kommentar + Admins.

### B4 — Pinning
- Schema: `pinnedAt: timestamp?` + `pinnedBy: userId?`.
- Wer darf pinnen: **Admins + Event-Owner / Thread-Author**.
- **Max. 3 gepinnte Kommentare** pro Thread (UX-Schutz).
- Anzeige: separater „Wichtig"-Block oberhalb des Streams; gepinnte Kommentare zusätzlich chronologisch im Stream.

### B5 — Inhaltsformat
- **Markdown** (fett, kursiv, Listen, Inline-Code, Code-Block, Links).
- Library-Wahl bei Implementierung — Vorschlag: `marked` + DOMPurify-Sanitize, da leichtgewichtig und in Edge-Runtime kompatibel.
- **Mentions** ins Backlog (separates Issue, viel später).
- **Bilder/Anhänge**: nicht in Scope.

### B6 — Notifications (Subscription-basiert)
- Neuer Notification-Typ in `shared/types/notifications.ts`, vermutlich `N-09 thread_new_comment` (genauer Code bei Implementierung).
- Es gibt **Thread-Subscriptions** (neue Tabelle `thread_subscriptions: userId, threadId, source: 'commented' | 'event_participant' | 'thread_author' | 'mention' | 'mandatory'`).
- **Auto-Subscribe** (wenn nicht bereits vorhanden):
  - Wer einen Kommentar im Thread schreibt
  - Wer am zugehörigen Event teilnimmt (Status `registered`)
  - Thread-Author
  - Mention-Empfänger (wenn Mentions implementiert sind)
- **Mandatory** (kein Opt-out) für **Vorstandsinfo-Threads**: alle aktiven Mitglieder mit Sektion-Match.
- User können sich pro Thread manuell abonnieren / abmelden (außer mandatory).
- Auf-Anmeldung-zum-Event: Auto-Subscribe für den Event-Thread.
- Auf-Abmeldung: Subscribe bleibt bestehen (User hat sich im Zweifel schon engagiert) — **TBD bei Implementierung, ggf. UI-Switch**.

### B7 — Read-State
- **Out of Scope**.

### B8 — Aktualität
- **Polling alle 30 s** auf der Thread-Detail-Seite, solange `document.visibilityState === 'visible'`.
- Auf der Threads-Liste kein Polling — wird beim Öffnen frisch geladen.
- Kein WebSocket / SSE.

## Phase C — Räume & Threads (abgeschlossen)

### C1 — Räume statt Typ-Dimension (Variante a)
- Räume sind die einzige Strukturierungs-Dimension v1.
- Späterer Thread-Typ **Umfrage** kommt als nächstes Feature darauf — das Datenmodell soll diesen Typ bei Implementierung mit kleinem Aufwand zulassen (z. B. `thread.kind: 'discussion' | 'poll'` als optionales Feld; default `'discussion'`).

### C2 — Räume v1
| Raum-Slug | Titel | Wer darf Threads anlegen | Auto-Threads aus Events |
|---|---|---|---|
| `announcements` | Ankündigungen | Admins | — |
| `training` | Training | Alle | `type='training'` |
| `team` | Team | Alle | — |
| `races` | Races | Alle | `type='competition'` und `type='ladv'` |
| `social` | Social | Alle | `type='social'` |

Räume sind **statisch** im Code definiert (kein CMS), kein Admin-UI fürs Anlegen.

### C3 — Sektions-Scoping
- v1: **alle Räume sektionsoffen**. Schema sieht ein optionales `sectionScope: string[]` am Thread vor, wird aber in v1 nicht von der UI/Logik genutzt.
- Mandatory-Subscribe für **Ankündigungen-Raum**: alle aktiven Mitglieder werden bei jedem neuen Thread im Raum „Ankündigungen" automatisch subscribed (kein Opt-out) → Notification N-09 oder analog geht raus.
- Vorstandsinfos = Threads im Raum „Ankündigungen". Kein eigener Typ nötig.

### C4 — Thread-Anlage-UX
- Felder: **Titel (Pflicht) + Body (Pflicht)**.
- Beim Anlegen wird der Body als **erster Kommentar** mit `threadId` gespeichert. Dadurch ist Edit-/Delete-Logik komplett uniform (keine Sonderbehandlung „Thread-Body").
- In der Threads-Liste: für nicht-Event-Threads werden **Titel + Auszug aus dem ersten Kommentar** zusammen angezeigt — sie gehören eng zusammen.
- Event-Threads zeigen in der Liste den Event-Titel + ggf. Datum/Ort, **keinen** ersten Kommentar (Events haben keinen).

### C5 — Event-Threads
- Titel = Event-Name (automatisch).
- Kein erster Kommentar / kein Body.
- Auf der Event-Detail-Seite: Stream **inline** gerendert (kein Link auf separate Seite).
- Auf der Threads-Liste: Eintrag mit Event-Titel; Klick führt auf **Event-Detail-Seite**, nicht auf eine separate Thread-Seite.

### C6 — Schließen / Locken
- Out of Scope. Threads bleiben offen.

### C7 — Pinned Threads (auf Thread-Ebene)
- Admin-only, max. 1–2 pro Raum.
- Pinned-Threads werden in der Liste oberhalb des chronologischen Streams als eigener Block gerendert.

### C8 — Sortierung, Filter, Räume-Navigation
- Default-Sortierung: **Last activity desc**.
- **Räume = Navigations-Ebene** (Tab/Segmented-Control oben, ggf. „Alle" als zusätzlicher Tab), **kein** zusätzlicher Filter darunter.
- Suche: out of scope für v1.

### C9 — Eigene/abonnierte Threads
- v1: globale Liste reicht. Kein „Meine Threads"-Filter.

## Phase D — Schema, Module, Notifications, Issues (abgeschlossen)

### D1 — Schema-Skizze

```
threads
  id PK
  roomSlug              ('announcements' | 'training' | 'team' | 'races' | 'social')
  title                 text NOT NULL
  kind                  ('discussion' | 'poll')   default 'discussion'
  eventId FK→events     nullable, UNIQUE          -- 1:1 mit Event
  pinnedAt              nullable                  -- Thread-Pin (C7)
  pinnedBy FK→users     nullable
  sectionScope JSON     nullable                  -- v1 ungenutzt
  lastActivityAt        timestamp NOT NULL        -- denormalisiert, für Sort
  createdBy FK→users    on delete set null
  createdAt / updatedAt

comments
  id PK
  threadId FK→threads   ON DELETE CASCADE
  userId FK→users
  body                  text (Markdown)
  pinnedAt              nullable                  -- Comment-Pin (B4)
  pinnedBy FK→users     nullable
  deletedAt             nullable                  -- Soft-Delete (B3)
  createdAt / updatedAt

thread_subscriptions
  id PK
  userId / threadId     ON DELETE CASCADE
  source                ('commented'|'event_participant'|'thread_author'|'mandatory'|'manual')
  createdAt
  UNIQUE(userId, threadId)
```

- `roomSlug` als String mit TS-Union — keine eigene Tabelle, weil Räume statisch im Code definiert sind.
- `lastActivityAt` denormalisiert; wird beim Comment-Insert/Edit/Delete aktualisiert.
- `event_comments` und `reactions` (mit `commentId`-FK auf alte Tabelle) werden **gelöscht und durch das neue Schema ersetzt** — keine Migration der Inhalte (keine Prod-DB).
- `reactions`-Tabelle wird **vorerst ebenfalls entfernt** (Schema-Hülle ohne Nutzen). Wenn Reactions später kommen, neu anlegen mit FK auf `comments.id`.

### D2 — Module

**Pure Utilities (`server/utils/threads.ts`)** — unit-testbar:
- `getRoomConfig(slug)` → `{ slug, title, allowedCreatorRoles, autoEventTypes, mandatorySubscribe }`
- `eventTypeToRoom(eventType)` → roomSlug
- `canCreateThread(user, room)` / `canPinThread(user, thread)` / `canPinComment(user, thread, comment)` / `canEditComment(user, comment)` / `canDeleteComment(user, comment)`

**Services (DB-Orchestrierung)**:
- `server/services/thread-service.ts` — `createThread`, `ensureEventThread(eventId)` (idempotent), `pinThread`/`unpinThread`, `subscribe`/`unsubscribe`
- `server/services/comment-service.ts` — `createComment`, `editComment`, `deleteComment` (Soft), `pinComment`/`unpinComment` — kümmert sich um `lastActivityAt`-Update + Auto-Subscribe + Notification-Enqueue
- `server/services/notification-thread.ts` — Empfänger-Resolution (Subscriber außer Author; bei Mandatory-Räumen: alle aktiven User), enqueue über bestehendes `notificationService.enqueue()`

**Markdown**:
- `server/utils/markdown.ts` — `renderMarkdown(text)` mit Sanitize (server-side für E-Mail / OG, client kann clientseitig rendern). Library-Wahl bei Implementierung; favorisiert: `marked` + `isomorphic-dompurify`. Edge-Runtime-kompatibel prüfen.

**API-Endpoints**:
- `GET /api/threads?room=…&cursor=…`
- `GET /api/threads/:id`
- `POST /api/threads`
- `POST /api/threads/:id/pin` / `DELETE /api/threads/:id/pin`
- `POST /api/threads/:id/subscribe` / `DELETE /api/threads/:id/subscribe`
- `GET /api/threads/:id/comments?since=…`  (Polling-Delta)
- `POST /api/threads/:id/comments`
- `PATCH /api/comments/:id`
- `DELETE /api/comments/:id` (Soft)
- `POST /api/comments/:id/pin` / `DELETE /api/comments/:id/pin`

### D3 — Frontend (Skizze)

- `app/pages/threads/index.vue` — Räume als Segmented-Control / Tabs („Alle" + 5 Räume); pro Raum-Tab Liste sortiert nach `lastActivityAt`; Pinned-Block oben.
- `app/pages/threads/[id].vue` — Chat-Style: asc, sticky bottom input, Auto-Scroll an Ende beim Mount, Polling 30 s.
- `app/pages/[id].vue` (Event-Detail) — Forum-Style: desc, Eingabe oben, Inline-Render des Event-Threads.
- Komponenten:
  - `Comment.vue` — Avatar, Name, Zeitstempel, Markdown-Body, Edit/Delete/Pin-Menü, Tombstone
  - `CommentInput.vue` — Markdown-Textarea + Vorschau-Tab
  - `CommentList.vue` — gemeinsame Liste, Render-Reihenfolge per Prop (`asc`/`desc`)
  - `PinnedCommentsBlock.vue` — bis zu 3 oberhalb des Streams
- Composable `useThreadPolling(threadId, since)` — 30 s Interval, Pause bei `document.hidden`.

### D4 — Notification-Defaults

- Neuer Notification-Typ in `shared/types/notifications.ts`, z. B. `'thread_new_comment'` (sowie ggf. `'thread_announcement'` für Mandatory-Versand).
- **Default**: Push **on**, E-Mail **off**.
- Mandatory-Variante (Raum „Ankündigungen") überschreibt das User-Override nicht — wird mandatory in `notificationDefaults` markiert, beide Kanäle aktiv (analog N-04 Event-Absage).
- UI in `/profil/benachrichtigungen` listet die neuen Typen; Mandatory-Toggles sind disabled.

### D5 — Tests

Unit-Tests für `server/utils/threads.ts` (alle Permission- und Routing-Funktionen) und `server/utils/markdown.ts` (XSS-Sanitize-Roundtrip mit `<script>`, `javascript:`, eingebetteten Eventhandlern). Services / Endpoints / Vue-Komponenten werden gemäß Test-Strategie aus CLAUDE.md **nicht** getestet.

## Issue-Schnitt (Epic + 12 Sub-Issues)

Ziel: jedes Sub-Issue ist ~1 Claude-Code-Session. Reihenfolge ist eine empfohlene Implementierungs-Reihenfolge (mit Vorzieh-Möglichkeit für Markdown).

**Epic-Issue: Threads & Kommentare** — zweigeteilt:
- *Teil 1 — Konzept (für Vereins-Diskussion):* Problem, Vision, Räume, Verhalten von Kommentaren, Threads, Pinning, Subscriptions, Vorstandsinfo-Mandatory, Mockup-Beschreibung.
- *Teil 2 — Technisch:* Schema, Module, API-Übersicht, Issue-Liste mit Checklist, Bezug auf altes Epic #21.

**Sub-Issues:**

1. **Markdown-Renderer + XSS-Sanitize** (Util, Vorzieh-Kandidat) — `server/utils/markdown.ts`, Tests, Edge-Runtime-Check.
2. **DB-Schema: Threads, Comments, Subscriptions** — Drop `event_comments`, drop `reactions`; neue Tabellen via Drizzle, Migration generieren.
3. **Räume-Konfiguration + Pure Utils** — `server/utils/threads.ts`: `roomConfig`, `eventTypeToRoom`, alle `canX`-Functions; Unit-Tests.
4. **Auto-Thread-Erstellung bei Events** — Hook in Event-Create-Endpoint + Backfill-Script (oder Migration) für bestehende Events; `ensureEventThread()`.
5. **Backend: Threads-API (GET/POST + Pin)** — list mit Räume-Filter + Sortierung, detail, create, pin/unpin.
6. **Backend: Comments-API (CRUD + Pin + Soft-Delete)** — list mit `?since=`, post, patch, delete (soft), pin/unpin; `lastActivityAt`-Update.
7. **Backend: Subscriptions + Auto-Subscribe-Hooks** — `thread_subscriptions`-CRUD, Auto-Subscribe bei: Comment, Event-Anmeldung, Thread-Author, Mandatory-Init für Ankündigungen-Threads. API zum manuellen subscribe/unsubscribe.
8. **Notifications: neuer Typ + Mandatory-Logik** — Defaults (Push on, Mail off), Mandatory für Ankündigungen, E-Mail-Template, enqueue im comment-service, Preferences-UI um neuen Typ ergänzen.
9. **Frontend: Threads-Liste** — `pages/threads/index.vue`, Räume-Tabs, Pinned-Block, Liste sortiert nach `lastActivityAt`, Klick führt auf Thread- bzw. Event-Detail.
10. **Frontend: Thread-Detail (Chat-UI + Polling)** — Chat-Style asc, sticky input, `useThreadPolling`, Markdown-Render, Comment-Komponente mit Edit/Delete/Pin, Tombstone, Subscribe-Toggle.
11. **Frontend: Event-Detail Stream-Integration** — Forum-Style desc, Input oben, Wiederverwendung von `CommentList`/`Comment`/`CommentInput`.
12. **Cleanup**: FEATURES.md ergänzen, alte Issues #21 / #12 / #13 schließen mit Verweis aufs neue Epic.

### Reihenfolge / Parallelisierungs-Optionen
- 1 (Markdown) und 3 (Pure Utils) sind unabhängig und können vorgezogen / parallel passieren.
- 2 → 4 → 5/6/7 (in dieser Reihenfolge sinnvoll, weil 4 das Auto-Thread-Verhalten setzt).
- 8 sinnvollerweise nach 6 (braucht enqueue-Hook).
- Frontend (9–11) kann starten, sobald 5/6 stehen.

## Out of Scope (final)

- Umfragen (kommt als nächstes Feature, Schema sieht `thread.kind='poll'` vor)
- Reactions-UI
- Mentions
- Bilder / Anhänge
- Read-State / Ungelesen-Indikator
- Realtime via WebSocket / SSE
- Suche
- Sektion-spezifische Räume in der Logik (Schema vorbereitet, UX/Logik später)
- Berechtigungen pro Thread-Typ als Mapping (kommt mit Umfragen)
- Thread schließen / locken
- „Meine Threads"-Filter
- Edit-History / Audit-Trail
- Migration alter Daten (keine Prod-DB → Tabellen werden ersatzlos ersetzt)

## Kritische Dateien (Übersicht)

- `server/db/schema.ts` — Tabellen `threads`, `comments`, `thread_subscriptions` neu; `event_comments` + `reactions` raus
- `server/db/migrations/` — auto-generierte Migration via `pnpm db:generate`
- `server/utils/threads.ts` — Räume-Config + Permission-Utils (testbar)
- `server/utils/markdown.ts` — Render + Sanitize (testbar)
- `server/services/thread-service.ts`, `server/services/comment-service.ts`, `server/services/notification-thread.ts`
- `server/api/threads/...`, `server/api/comments/...`
- Hook in `server/api/events/...post.ts` (Event-Create) für `ensureEventThread`
- `shared/types/notifications.ts` — neuer Typ + Defaults
- `shared/types/threads.ts` (neu)
- `app/pages/threads/index.vue`, `app/pages/threads/[id].vue`
- `app/pages/[id].vue` — Event-Detail-Integration
- `app/components/thread/Comment.vue`, `CommentInput.vue`, `CommentList.vue`, `PinnedCommentsBlock.vue`
- `app/composables/useThreadPolling.ts`
- `FEATURES.md` — neuer Abschnitt nach v1
- alte Issues #21 / #12 / #13 schließen mit Verweis

## Verifikation (End-to-End-Test nach Implementierung)

- `pnpm dev` startet ohne Migrations-Fehler
- `pnpm typecheck 2>&1; echo "Exit: $?"` exit 0
- `pnpm lint:fix` clean
- `pnpm test` — neue Unit-Tests grün
- Manuell: Event anlegen → Thread automatisch da → Kommentar verfassen → editieren → soft-deleten (Tombstone) → pinnen
- Manuell: Vorstandsinfo im Raum „Ankündigungen" anlegen → mandatory Push an alle aktiven User
- Manuell: Polling läuft im Thread, stoppt bei Tab-Wechsel
- Manuell: alte Routen / Endpoints für `event_comments` 404 (sind ja entfernt)

## Vorgehen nach Plan-Approval

Sobald der Plan freigegeben ist, mache ich (außerhalb von Plan Mode):
1. Diese Plan-Datei als Historie nach `planning/threads-und-kommentare-prd.md` kopieren (Konvention der älteren Planungsdokumente).
2. Epic-Issue mit zweigeteiltem Body (Konzept zuerst, Technisches dahinter) via `gh issue create` anlegen.
3. Die 12 Sub-Issues anlegen, jedes ausführlich mit Akzeptanzkriterien und kontext-relevanten Hinweisen.
4. Sub-Issues als Checklist im Epic verlinken.
5. Die 3 alten Issues #21, #12, #13 mit Kommentar schließen, der aufs neue Epic verweist.
6. **Keine** Code-Änderungen — nur Issues + Plan-History.

## Out of Scope

- Umfragen (mitgedacht, kommen später als eigener Thread-Typ oder Comment-Erweiterung)
- Reactions-UI (Schema existiert, bewusst nicht in v2)
- Realtime-WebSockets (vermutlich Polling/Refresh — TBD)
- Berechtigungssystem pro Thread-Typ (Schema vorsehen, UX/Logik später)

## Kritische Dateien (vorläufig)

- `server/db/schema.ts` — neue Tabellen `threads`, `comments`, ggf. `rooms`; Migration für `event_comments` → `comments`
- `server/api/events/[id].post.ts` (oder wo auch immer Events erstellt werden) — Auto-Thread anlegen
- `server/api/threads/` — neuer API-Bereich
- `server/api/comments/` — neuer API-Bereich
- `app/pages/[id].vue` (Event-Detail) — Kommentar-Bereich integrieren
- `app/pages/threads/...` — neue Threads-Seite + Detailseite
- `shared/types/` — Typen für Thread, Comment, Room
- `FEATURES.md` — am Ende ergänzen
