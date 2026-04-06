# UX-Redesign: Event-Detail-Seite — Strukturelle Neuorganisation

_Stand: 2026-04-06 | Audit durchgeführt mit `/audit`_

---

## Hintergrund & Ausgangsproblem

Die Event-Detail-Seite (`app/pages/events/[id]/index.vue`) hat funktionierende Komponenten, aber eine strukturell inkohärente Anordnung:

1. **Admin-Buttons konkurrieren mit dem Seitentitel** — Edit/Sync/Absagen sitzen im selben flex-row wie der h1
2. **Sync-Button ist semantisch falsch** — steht bei Admin-Actions, gehört zu LADV-Infos
3. **Sidebar ist halbfertig** — `lg:w-64` für zwei Links; die wichtigste Nutzeraktion (`EventRegisterForm`) ist in der Main-Spalte vergraben
4. **`EventComments` ist ein Placeholder** — zeigt nur "Kommentare folgen in Kürze.", reserviert aber sichtbaren Platz
5. **Sektionen ohne konsistente visuelle Trennung** — alle fließen mit `space-y-8` ineinander

---

## Zielstruktur

```
Header (volle Breite, standalone)
  └─ EventHeader: h1 + Badges + Meta + border-b

Abgesagt-Alert (wenn cancelledAt)

Two-Column Layout (flex-col mobile → flex-row lg)
  ├─ Sidebar (order-1 mobile, lg:order-2)  →  erscheint auf Mobile VOR den Listen
  │   ├─ EventRegisterForm ("Deine Anmeldung")
  │   ├─ Ausschreibung-Link (wenn vorhanden)
  │   ├─ Admin-Aktionen (wenn canEdit)
  │   │   ├─ [Bearbeiten-Button]
  │   │   └─ [Absagen / Reaktivieren-Button]
  │   └─ BTC Community
  │
  └─ Main (order-2 mobile, lg:order-1)  →  Info + Listen
      ├─ EventLadvInfo (mit integriertem Sync-Button)
      ├─ EventRegistrationList
      └─ EventAdminLadvTodos (isAdmin && isLadv)
```

**Rationale Sidebar-First auf Mobile:** Die Anmeldung ist die primäre Nutzeraktion. Auf Desktop ist sie rechts sofort sichtbar; auf Mobile soll sie vor der Anmeldungsliste erscheinen, nicht danach.

---

## P1 — Strukturelle Neuorganisation (detaillierter Implementierungsplan)

### Betroffene Dateien

| Datei | Art der Änderung |
|---|---|
| `app/pages/events/[id]/index.vue` | Template-Umbau: Header raus aus flex-row, Sidebar befüllen, Sync-Button delegieren, EventComments entfernen |
| `app/components/event/EventLadvInfo.vue` | Sync-Button-Props + Emit ergänzen |

Keine Backend-Änderungen. Keine Typ-Änderungen.

---

### Schritt 1 — `EventLadvInfo.vue`: Sync-Button integrieren

**Props ergänzen:**
```ts
const props = defineProps<{
  data: LadvAusschreibung
  lastSync?: Date | string | null
  showSync?: boolean       // NEU
  syncLoading?: boolean    // NEU
}>()

const emit = defineEmits<{         // NEU
  'sync-click': []
}>()
```

**Template: Header-Row erweitern** (aktuell Zeile 42–56):

Aktuell:
```html
<div class="flex items-center justify-between gap-4">
  <h2 class="font-semibold text-highlighted">
    LADV-Informationen
  </h2>
  <span v-if="lastSync" class="flex items-center gap-1 text-xs text-muted">
    <UIcon name="i-ph-arrows-clockwise" class="size-3.5" />
    Sync: {{ formatDateTime(lastSync) }}
  </span>
</div>
```

Neu:
```html
<div class="flex items-center justify-between gap-4">
  <h2 class="font-semibold text-highlighted">
    LADV-Informationen
  </h2>
  <div class="flex items-center gap-3 shrink-0">
    <span v-if="lastSync" class="flex items-center gap-1 text-xs text-muted">
      <UIcon name="i-ph-arrows-clockwise" class="size-3.5" />
      Sync: {{ formatDateTime(lastSync) }}
    </span>
    <UButton
      v-if="showSync"
      icon="i-ph-arrows-clockwise"
      label="Sync"
      color="neutral"
      variant="ghost"
      size="xs"
      :loading="syncLoading"
      @click="$emit('sync-click')"
    />
  </div>
</div>
```

---

### Schritt 2 — `index.vue`: Template-Umbau

**Script-Block: keine Änderungen** — alle bestehenden Funktionen (`syncLadv`, `confirmCancel`, `uncancel`, computed properties) bleiben unverändert.

**Template: Neue Struktur** (ersetzt den gesamten `v-else-if="event"` Block):

```html
<div v-else-if="event">
  <!-- Header: volle Breite, standalone (kein flex-row mit Admin-Buttons mehr) -->
  <EventHeader
    :event="event"
    class="mb-8"
  />

  <!-- Abgesagt-Alert -->
  <UAlert
    v-if="isCancelled"
    icon="i-ph-warning-circle"
    color="error"
    variant="subtle"
    title="Dieses Event wurde abgesagt"
    :description="`Abgesagt am ${formatDate(event.cancelledAt)}`"
    class="mb-8"
  />

  <!-- Two-Column Layout -->
  <div class="flex flex-col gap-8 lg:flex-row lg:gap-16 lg:items-start">

    <!-- Sidebar: order-1 auf Mobile (erscheint vor den Listen), lg:order-2 -->
    <aside class="order-1 lg:order-2 lg:w-64 xl:w-72 lg:shrink-0 lg:sticky lg:top-[calc(var(--ui-header-height)+2rem)] space-y-5">

      <!-- Deine Anmeldung -->
      <EventRegisterForm
        :event="event"
        @refresh="refresh"
      />

      <!-- Ausschreibung -->
      <div
        v-if="event.announcementLink"
        class="pt-5 border-t border-default"
      >
        <p class="text-xs font-medium text-muted uppercase tracking-widest mb-3">
          Ausschreibung
        </p>
        <UButton
          :to="event.announcementLink"
          target="_blank"
          rel="noopener noreferrer"
          color="neutral"
          variant="outline"
          trailing-icon="i-ph-arrow-up-right-bold"
          block
        >
          Ausschreibung öffnen
        </UButton>
      </div>

      <!-- Admin-Aktionen -->
      <div
        v-if="canEdit"
        class="pt-5 border-t border-default space-y-2"
      >
        <p class="text-xs font-medium text-muted uppercase tracking-widest mb-3">
          Admin
        </p>
        <div class="flex flex-col gap-2">
          <UButton
            :to="`/events/${id}/bearbeiten`"
            icon="i-ph-pencil-simple"
            label="Bearbeiten"
            color="neutral"
            variant="outline"
            size="sm"
            block
          />
          <UButton
            v-if="isAdmin && !isCancelled"
            icon="i-ph-x-circle"
            label="Event absagen"
            color="error"
            variant="outline"
            size="sm"
            block
            @click="cancelModal = true"
          />
          <UButton
            v-if="isAdmin && isCancelled"
            icon="i-ph-arrow-u-up-left"
            label="Reaktivieren"
            color="neutral"
            variant="outline"
            size="sm"
            block
            @click="uncancel"
          />
        </div>
      </div>

      <!-- BTC Community -->
      <div class="pt-5 border-t border-default">
        <p class="text-xs font-medium text-muted uppercase tracking-widest mb-3">
          Fragen?
        </p>
        <p class="text-sm text-muted mb-3 leading-relaxed">
          Bei Fragen zum Event wende dich über die BTC Community an die Coaches.
        </p>
        <UButton
          to="https://app.campai.com/pt/9a0cd/rooms/room/688357998a5abe1409d4fc8e/channel"
          target="_blank"
          rel="noopener noreferrer"
          color="neutral"
          variant="outline"
          size="sm"
          trailing-icon="i-ph-arrow-up-right-bold"
          block
        >
          BTC Community
        </UButton>
      </div>
    </aside>

    <!-- Main: Info + Listen — order-2 auf Mobile, lg:order-1 -->
    <div class="order-2 lg:order-1 flex-1 min-w-0 space-y-8">

      <EventLadvInfo
        v-if="isLadv && event.ladvData"
        :data="event.ladvData"
        :last-sync="event.ladvLastSync"
        :show-sync="isAdmin"
        :sync-loading="syncLoading"
        @sync-click="syncLadv"
      />

      <EventRegistrationList
        :registrations="event.registrations"
        :event-type="event.type"
      />

      <EventAdminLadvTodos
        v-if="isAdmin && isLadv"
        :event="event"
        @refresh="refresh"
      />

    </div>
  </div>
</div>
```

**`EventComments` wird vollständig entfernt** — kein Placeholder auf der Seite.

---

### Offene Frage: EventHeader border-b

`EventHeader.vue` hat intern `pb-6 border-b border-default` als Wrapper. Das funktioniert standalone weiterhin — kein Änderungsbedarf.

Der `mb-8` am EventHeader-Aufruf in index.vue erzeugt den Abstand zum nächsten Element (Alert oder Two-Column). Alternativ: `space-y-8` auf den Elterncontainer.

---

## P2 — Hard-coded Farben normalisieren

### `EventRegisterForm.vue:24-27` — Status-Chip

```ts
// Aktuell: hard-coded Farbklassen
if (s === 'registered' || s === 'yes')
  return 'bg-green-500/12 dark:bg-green-400/12 text-green-700 dark:text-green-400'
if (s === 'maybe')
  return 'bg-amber-500/12 dark:bg-amber-400/12 text-amber-700 dark:text-amber-400'
if (s === 'canceled' || s === 'no')
  return 'bg-red-500/12 dark:bg-red-400/12 text-red-700 dark:text-red-400'
```

Laut `.impeccable.md` sind diese Farben gewollt (green/amber/red als Statussemantik), aber die Dark-Mode-Varianten sollten Tokens statt Hard-Coded sein. Minimaler Fix: in `registration-ui.ts` als Konstante auslagern.

Alternativ: einen `UBadge color="success/warning/error"` statt einem custom `<span>` verwenden — aber das ändert das visuelle Design (Badge-Form vs. Status-Chip mit Ping-Dot).

**Empfehlung:** Vorerst belassen, da bewusste Design-Entscheidung. In `/normalize`-Session adressieren.

### `EventHeader.vue:72` — Abgelaufene Meldefrist

```html
:class="deadlineExpired ? 'text-red-600 dark:text-red-400' : ''"
```

Fix: `text-error` (Nuxt UI semantic token).

---

## P3 — Kleinere Findings

### EventComments Placeholder entfernen
- Location: `app/components/event/EventComments.vue` + Aufruf in `index.vue`
- Zeigt "Kommentare folgen in Kürze." ohne Funktion
- **Fix:** Aufruf in `index.vue` entfernen; Komponente selbst belassen bis Session 9.10

### Heading-Konsistenz in Sektionen
- `EventRegisterForm.vue:291` — h2 mit `border-b pb-3`
- `EventRegistrationList.vue:45` — h2 ohne Trenner
- `EventAdminLadvTodos.vue:68` — h2 ohne Trenner
- Kein einheitliches Sektions-Pattern; kann in `/arrange`-Session vereinheitlicht werden

---

## Reihenfolge der Umsetzung

1. **P1** — Strukturumbau (dieser Plan): `EventLadvInfo.vue` anpassen, dann `index.vue` umbauen
2. **P2 (EventHeader)** — Einzeiler: `text-red-600 dark:text-red-400` → `text-error`
3. **P3 (Comments)** — Aufruf in index.vue entfernen (eine Zeile)
4. **P2 (Farben normalize)** — Separate `/normalize`-Session wenn nötig
5. **P3 (Sektions-Separator)** — Separate `/arrange`-Session

---

## Kontext-Files für Umsetzungs-Session

→ Siehe `planning/ux/event-detail-kontext.md` für kompaktes Briefing ohne große Dateien lesen zu müssen.
