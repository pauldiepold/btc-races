# Kontext-Briefing: Event-Detail-Seite

_Kompaktes Briefing für UX-Sessions — ersetzt das Lesen der großen Implementierungsdateien_

---

## Was diese Seite macht

`app/pages/events/[id]/index.vue` — Detail-Ansicht eines Events.
`app/pages/events/[id].vue` — Elternroute, nur `<NuxtPage />`, nötig für Nuxt-Nested-Routing, nicht anfassen.

---

## Komponenten auf der Seite

| Komponente | Pfad | Was sie tut |
|---|---|---|
| `EventHeader` | `app/components/event/EventHeader.vue` | h1 + Datum-Block links + Badges + Meta-Zeile (Ort, Meldeschluss, Disziplin). Hat intern `pb-6 border-b border-default`. |
| `EventLadvInfo` | `app/components/event/EventLadvInfo.vue` | LADV-Infos (Veranstalter, Beschreibung, Wettbewerbe als Accordion). Props: `data`, `lastSync`. Nur für `type === 'ladv'`. |
| `EventRegisterForm` | `app/components/event/EventRegisterForm.vue` | Anmeldeformular + eigene Anmeldung verwalten (Status, Disziplinen, Notiz). Props: `event`. Emit: `refresh`. |
| `EventRegistrationList` | `app/components/event/EventRegistrationList.vue` | Tab-basierte Anmeldungsliste (alle Mitglieder). Props: `registrations`, `eventType`. |
| `EventAdminLadvTodos` | `app/components/event/EventAdminLadvTodos.vue` | LADV-Admin-Todos (wer muss noch bei LADV angemeldet/abgemeldet werden). Nur für `isAdmin && isLadv`. |
| `EventComments` | `app/components/event/EventComments.vue` | **Placeholder** — zeigt nur "Kommentare folgen in Kürze." Noch nicht implementiert (Session 9.10). |

---

## Seitenlogik (Script-Zusammenfassung)

```ts
// Daten
useFetch<EventDetail>(`/api/events/${id}`)

// Berechtigungen
isAdmin  = role === 'admin' || 'superuser'
isOwner  = event.createdBy === session.user.id
canEdit  = isAdmin || isOwner
isLadv   = event.type === 'ladv'
isCancelled = !!event.cancelledAt

// Aktionen in index.vue
confirmCancel()  // POST /api/events/:id/cancel
uncancel()       // POST /api/events/:id/uncancel
syncLadv()       // POST /api/events/:id/sync → diff-Toast wenn Felder abweichen
```

---

## EventDetail-Typ (relevante Felder)

```ts
// Quelle: shared/types/events.ts
type EventDetail = {
  id: string
  name: string
  type: 'ladv' | 'competition' | 'training' | 'social'
  date: string
  location?: string
  description?: string
  announcementLink?: string
  registrationDeadline?: string
  cancelledAt?: string | null
  createdBy: string
  isWrc: boolean
  raceType?: string
  championshipType?: string
  ladvId?: string
  ladvData?: LadvAusschreibung | null
  ladvLastSync?: string | null
  registrations: RegistrationDetail[]
}
```

---

## Design-Kontext (aus `.impeccable.md`)

- **Farben:** Black/Yellow (`zinc-950` + `#ffb700`). Dark Mode primär.
- **Fonts:** Raleway (Body), Space Grotesk (Headings, `.font-display`)
- **Tokens:** `text-muted`, `text-highlighted`, `border-default`, `bg-elevated`, `bg-accented` — konsequent nutzen, keine hard-coded Farben
- **Radius:** `--ui-radius` = `0.25rem` (scharf, kein rounded-xl)
- **Status-Farben:** `green` = registered/yes, `amber` = maybe, `red` = canceled/no — **amber statt yellow** (yellow = Brand)
- **Prinzip:** Kein visuelles Rauschen, Kontrast vor Dekoration, mobile-first

---

## Aktuelle UX-Issues & Pläne

| Priorität | Issue | Plan-Datei |
|---|---|---|
| **P1** | Admin-Buttons konkurrieren mit h1; Sync falsch platziert; RegisterForm in falscher Spalte; Sidebar halb leer | `event-detail-restructure.md` |
| **P2** | `text-red-600 dark:text-red-400` in `EventHeader:72` → `text-error` | In P1-Session miterledigen |
| **P3** | `EventComments`-Placeholder entfernen | In P1-Session miterledigen (eine Zeile) |
| **P2** | Status-Chip-Farben in `EventRegisterForm:24-27` hard-coded | Separate `/normalize`-Session |
| **P3** | Sektions-Separatoren inkonsistent | Separate `/arrange`-Session |

---

## Geplante Zielstruktur (nach P1)

```
EventHeader (volle Breite)
UAlert (wenn abgesagt)

flex-col mobile → flex-row lg:
  ├─ Sidebar (order-1 mobile / order-2 desktop) lg:w-64 xl:w-72 sticky
  │   ├─ EventRegisterForm
  │   ├─ Ausschreibung (wenn announcementLink)
  │   ├─ Admin-Aktionen (wenn canEdit): Bearbeiten + Absagen/Reaktivieren
  │   └─ BTC Community
  │
  └─ Main (order-2 mobile / order-1 desktop) flex-1
      ├─ EventLadvInfo (mit Sync-Button als @sync-click Emit)
      ├─ EventRegistrationList
      └─ EventAdminLadvTodos (isAdmin && isLadv)
```
