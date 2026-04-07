<script setup lang="ts">
import type { EventListItem } from '~~/shared/types/events'

definePageMeta({ title: 'Events' })

const typeFilter = ref<string | undefined>(undefined)
const timeRange = ref('upcoming')
const searchQuery = ref('')
const raceTypeFilter = ref<'track' | 'road' | undefined>(undefined)
const championshipFilter = ref<'bbm' | 'ndm' | 'dm' | undefined>(undefined)
const isCreateModalOpen = ref(false)

type CreateEventType = 'ladv' | 'competition' | 'training' | 'social'

async function handleCreate(type: CreateEventType) {
  isCreateModalOpen.value = false
  if (type === 'ladv') {
    await navigateTo('/events/ladv-importieren')
  }
  else {
    await navigateTo(`/events/neu?type=${type}`)
  }
}

const createOptions: { type: CreateEventType, label: string, description: string, icon: string }[] = [
  {
    type: 'ladv',
    label: 'LADV-Import',
    description: 'Wettkampf aus der LADV-Datenbank importieren',
    icon: 'i-ph-download-simple',
  },
  {
    type: 'competition',
    label: 'Wettkampf',
    description: 'Wettkampf manuell anlegen',
    icon: 'i-ph-trophy',
  },
  {
    type: 'training',
    label: 'Training',
    description: 'Trainingstermin erstellen',
    icon: 'i-ph-lightning',
  },
  {
    type: 'social',
    label: 'Social',
    description: 'Gemeinschaftsevent anlegen',
    icon: 'i-ph-confetti',
  },
]

const { data: events, status } = await useFetch<EventListItem[]>('/api/events', {
  query: computed(() => ({
    type: typeFilter.value || undefined,
    timeRange: timeRange.value,
  })),
})

const typeFilterItems = [
  { label: 'Alle Events', value: undefined },
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
  { label: 'Bahn und Straße', value: undefined },
  { label: 'Bahn', value: 'track' },
  { label: 'Straße', value: 'road' },
]

const championshipItems = [
  { label: 'Alle Wertungen', value: undefined },
  { label: 'BBM', value: 'bbm' },
  { label: 'NDM', value: 'ndm' },
  { label: 'DM', value: 'dm' },
]

const hasRaceTypeEvents = computed(() => (events.value ?? []).some(e => e.raceType))
const hasChampionshipEvents = computed(() => (events.value ?? []).some(e => e.championshipType && e.championshipType !== 'none'))

const activeSecondaryFilterCount = computed(() => {
  let count = 0
  if (typeFilter.value) count++
  if (raceTypeFilter.value) count++
  if (championshipFilter.value) count++
  return count
})

const isFilterPopoverOpen = ref(false)

function resetSecondaryFilters() {
  typeFilter.value = undefined
  raceTypeFilter.value = undefined
  championshipFilter.value = undefined
  isFilterPopoverOpen.value = false
}

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
        <div class="mb-6">
          <p class="text-xs font-medium text-muted uppercase tracking-widest mb-2">
            Berlin Track Club
          </p>
          <h1 class="text-3xl font-bold tracking-tight text-highlighted">
            {{ pageTitle }}
          </h1>
        </div>

        <!-- Filter-Zeile -->
        <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <UInput
            v-model="searchQuery"
            placeholder="Suchen..."
            size="sm"
            icon="i-ph-magnifying-glass"
            class="flex-1 min-w-0"
          />
          <div class="flex items-center gap-2">
            <USelect
              v-model="timeRange"
              :items="timeRangeItems"
              size="sm"
              value-key="value"
              label-key="label"
              class="flex-1 sm:w-36 sm:flex-none"
            />
            <UPopover v-model:open="isFilterPopoverOpen">
              <UButton
                size="sm"
                :color="activeSecondaryFilterCount ? 'primary' : 'neutral'"
                variant="outline"
                icon="i-ph-funnel"
                :label="activeSecondaryFilterCount ? `Filtern (${activeSecondaryFilterCount})` : 'Filtern'"
              />
              <template #content>
                <div class="p-3 w-52 space-y-3">
                  <div class="space-y-1.5">
                    <p class="text-xs font-medium text-muted uppercase tracking-widest">
                      Typ
                    </p>
                    <USelect
                      v-model="typeFilter"
                      :items="typeFilterItems"
                      placeholder="Alle Events"
                      size="sm"
                      value-key="value"
                      label-key="label"
                    />
                  </div>
                  <div
                    v-if="hasRaceTypeEvents"
                    class="space-y-1.5"
                  >
                    <p class="text-xs font-medium text-muted uppercase tracking-widest">
                      Streckentyp
                    </p>
                    <USelect
                      v-model="raceTypeFilter"
                      :items="raceTypeItems"
                      placeholder="Bahn und Straße"
                      size="sm"
                      value-key="value"
                      label-key="label"
                    />
                  </div>
                  <div
                    v-if="hasChampionshipEvents"
                    class="space-y-1.5"
                  >
                    <p class="text-xs font-medium text-muted uppercase tracking-widest">
                      Meisterschaft
                    </p>
                    <USelect
                      v-model="championshipFilter"
                      :items="championshipItems"
                      placeholder="Alle Wertungen"
                      size="sm"
                      value-key="value"
                      label-key="label"
                    />
                  </div>
                  <div
                    v-if="activeSecondaryFilterCount"
                    class="pt-2 border-t border-default"
                  >
                    <UButton
                      size="xs"
                      color="neutral"
                      variant="ghost"
                      icon="i-ph-x"
                      label="Zurücksetzen"
                      @click="resetSecondaryFilters"
                    />
                  </div>
                </div>
              </template>
            </UPopover>

            <div class="ml-auto">
              <UModal
                v-model:open="isCreateModalOpen"
                title="Event erstellen"
                description="Wähle, welche Art von Event du anlegen möchtest."
              >
                <UButton
                  size="sm"
                  icon="i-ph-plus"
                  label="Event erstellen"
                />
                <template #body>
                  <div class="space-y-2">
                    <button
                      v-for="option in createOptions"
                      :key="option.type"
                      class="w-full flex items-start gap-3 p-3 rounded-[--ui-radius] border border-default hover:bg-elevated transition-colors text-left"
                      @click="handleCreate(option.type)"
                    >
                      <div class="mt-0.5 size-8 rounded-[--ui-radius] bg-primary/10 flex items-center justify-center shrink-0">
                        <UIcon
                          :name="option.icon"
                          class="size-4 text-primary"
                        />
                      </div>
                      <div>
                        <p class="text-sm font-medium text-highlighted">
                          {{ option.label }}
                        </p>
                        <p class="text-xs text-muted mt-0.5">
                          {{ option.description }}
                        </p>
                      </div>
                    </button>
                  </div>
                </template>
              </UModal>
            </div>
          </div>
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
