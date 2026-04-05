<script setup lang="ts">
import type { EventListItem } from '~~/shared/types/events'

definePageMeta({ title: 'Events' })

const typeFilter = ref<string | undefined>(undefined)
const timeRange = ref('upcoming')
const searchQuery = ref('')
const raceTypeFilter = ref<'track' | 'road' | undefined>(undefined)
const championshipFilter = ref<'bbm' | 'ndm' | 'dm' | undefined>(undefined)

const { data: events, status } = await useFetch<EventListItem[]>('/api/events', {
  query: computed(() => ({
    type: typeFilter.value || undefined,
    timeRange: timeRange.value,
  })),
})

const typeFilterItems = [
  { label: 'Alle Typen', value: undefined },
  { label: 'LADV', value: 'ladv' },
  { label: 'Wettkampf', value: 'competition' },
  { label: 'Training', value: 'training' },
  { label: 'Social', value: 'social' },
]

const timeRangeItems = [
  { label: 'Alle', value: 'all' },
  { label: 'Vergangene', value: 'past' },
  { label: 'Kommende', value: 'upcoming' },
]

const raceTypeItems = [
  { label: 'Bahn', value: 'track' },
  { label: 'Straße', value: 'road' },
]

const championshipItems = computed(() => {
  const types = new Set((events.value ?? []).map(e => e.championshipType).filter(t => t && t !== 'none'))
  const labels: Record<string, string> = { bbm: 'BBM', ndm: 'NDM', dm: 'DM' }
  return [...types].map(t => ({ label: labels[t!] ?? t!, value: t! }))
})

const hasRaceTypeEvents = computed(() => (events.value ?? []).some(e => e.raceType))
const hasChampionshipEvents = computed(() => (events.value ?? []).some(e => e.championshipType && e.championshipType !== 'none'))

const filteredEvents = computed(() => {
  return (events.value ?? []).filter((e) => {
    if (raceTypeFilter.value && e.raceType !== raceTypeFilter.value) return false
    if (championshipFilter.value && e.championshipType !== championshipFilter.value) return false
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      return (
        e.name.toLowerCase().includes(q)
        || e.location?.toLowerCase().includes(q)
        || e.description?.toLowerCase().includes(q)
      )
    }
    return true
  })
})

const pageTitle = computed(() => {
  if (timeRange.value === 'past') return 'Vergangene Events'
  if (timeRange.value === 'all') return 'Alle Events'
  return 'Kommende Events'
})

const steps = [
  {
    number: '01',
    title: 'Event auswählen',
    description: 'Stöbere durch die anstehenden Wettkämpfe und such dir deinen nächsten Start.',
  },
  {
    number: '02',
    title: 'Anmelden',
    description: 'Deine Anmeldung zu meldepflichtigen Wettkämpfen landet direkt bei den Coaches.',
  },
  {
    number: '03',
    title: 'Starten',
    description: 'Die Coaches kümmern sich um die LADV-Einschreibung und informieren dich per E-Mail.',
  },
]
</script>

<template>
  <UContainer class="py-10 lg:py-14">
    <div class="flex flex-col gap-14 lg:flex-row lg:gap-16 lg:items-start">
      <!-- ── Events (Hauptinhalt) ──────────────────────────────────── -->
      <div class="flex-1 min-w-0">
        <!-- Abschnittsheader -->
        <div class="flex items-end justify-between mb-6 pb-5 border-b border-default">
          <div>
            <p class="text-xs font-medium text-muted uppercase tracking-widest mb-2">
              Berlin Track Club
            </p>
            <h1 class="text-3xl font-bold tracking-tight text-highlighted">
              {{ pageTitle }}
            </h1>
          </div>

          <div class="flex items-center gap-2">
            <UButton
              to="/events/ladv-importieren"
              icon="i-ph-download-simple"
              label="LADV importieren"
              color="neutral"
              variant="ghost"
              size="sm"
              class="hidden sm:flex"
            />
            <UButton
              to="/events/neu"
              icon="i-ph-plus"
              label="Event erstellen"
              size="sm"
            />
          </div>
        </div>

        <!-- Filter-Zeile -->
        <div class="flex flex-wrap items-center gap-2 mb-4">
          <UInput
            v-model="searchQuery"
            placeholder="Suchen..."
            size="sm"
            icon="i-ph-magnifying-glass"
            class="flex-1 min-w-40"
          />
          <USelect
            v-model="typeFilter"
            :items="typeFilterItems"
            placeholder="Alle Typen"
            size="sm"
            value-key="value"
            label-key="label"
          />
          <USelect
            v-model="timeRange"
            :items="timeRangeItems"
            size="sm"
            value-key="value"
            label-key="label"
            class="w-36"
          />
          <USelect
            v-if="hasRaceTypeEvents"
            v-model="raceTypeFilter"
            :items="raceTypeItems"
            placeholder="Alle Rennarten"
            size="sm"
            value-key="value"
            label-key="label"
          />
          <USelect
            v-if="hasChampionshipEvents"
            v-model="championshipFilter"
            :items="championshipItems"
            placeholder="Alle Meisterschaften"
            size="sm"
            value-key="value"
            label-key="label"
          />
        </div>

        <!-- Lade-Zustand -->
        <div
          v-if="status === 'pending'"
          class="space-y-2"
        >
          <div
            v-for="i in 5"
            :key="i"
            class="flex items-center gap-4 px-4 py-4 rounded-[--ui-radius] border border-default bg-muted"
          >
            <div class="shrink-0 flex flex-col items-center w-10 gap-1">
              <USkeleton class="h-5 w-7" />
              <USkeleton class="h-3 w-8" />
            </div>
            <div class="w-px h-9 bg-border shrink-0" />
            <div class="flex-1 min-w-0 space-y-2">
              <USkeleton class="h-4 w-56" />
              <USkeleton class="h-3 w-32" />
            </div>
            <div class="shrink-0 hidden sm:flex items-center gap-3">
              <USkeleton class="h-5 w-16 rounded-full" />
              <USkeleton class="h-8 w-20 rounded-[--ui-radius]" />
            </div>
          </div>
        </div>

        <!-- Leer-Zustand -->
        <div
          v-else-if="filteredEvents.length === 0"
          class="py-16 text-center text-muted"
        >
          <UIcon
            name="i-ph-calendar-x"
            class="size-10 mb-3 mx-auto opacity-40"
          />
          <p>Keine Events gefunden</p>
        </div>

        <!-- Event-Liste -->
        <div
          v-else
          class="space-y-2"
        >
          <EventCard
            v-for="event in filteredEvents"
            :key="event.id"
            :event="event"
          />
        </div>
      </div>

      <!-- ── Sidebar: Erklärung ────────────────────────────────────── -->
      <aside class="lg:w-64 xl:w-72 lg:shrink-0 lg:sticky lg:top-[calc(var(--ui-header-height)+2rem)]">
        <div class="pb-5 mb-6 border-b border-default">
          <p class="text-xs font-medium text-muted uppercase tracking-widest mb-2">
            So funktioniert's
          </p>
          <h2 class="font-display font-semibold text-xl text-highlighted">
            In drei Schritten zum Start
          </h2>
        </div>

        <ol class="space-y-7">
          <li
            v-for="step in steps"
            :key="step.number"
            class="flex gap-4"
          >
            <span class="font-display font-bold text-2xl text-primary leading-none shrink-0 tabular-nums w-8">
              {{ step.number }}
            </span>
            <div>
              <p class="font-semibold text-sm text-highlighted mb-1">
                {{ step.title }}
              </p>
              <p class="text-sm text-muted leading-relaxed">
                {{ step.description }}
              </p>
            </div>
          </li>
        </ol>

        <div class="mt-8 pt-6 border-t border-default space-y-3">
          <p class="text-sm text-muted">
            Fragen oder Probleme?
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
    </div>
  </UContainer>
</template>
