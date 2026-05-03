<script setup lang="ts">
type CreateEventType = 'ladv' | 'competition' | 'training' | 'social'

const searchQuery = defineModel<string>('searchQuery', { required: true })
const timeRange = defineModel<string>('timeRange', { required: true })
const typeFilter = defineModel<string | undefined>('typeFilter')
const raceTypeFilter = defineModel<'track' | 'road' | 'trail' | undefined>('raceTypeFilter')
const championshipFilter = defineModel<'bbm' | 'ndm' | 'dm' | undefined>('championshipFilter')
const priorityFilter = defineModel<'A' | 'B' | 'C' | undefined>('priorityFilter')
const wrcFilter = defineModel<boolean>('wrcFilter', { default: false })
const disciplineFilter = defineModel<string | undefined>('disciplineFilter')
const ageClassFilter = defineModel<string | undefined>('ageClassFilter')

const props = defineProps<{
  hasRaceTypeEvents: boolean
  hasChampionshipEvents: boolean
  hasPriorityEvents: boolean
  hasWrcEvents: boolean
  availableDisciplines: string[]
  availableAgeClasses: string[]
  publicMode?: boolean
}>()

const isCreateModalOpen = ref(false)
const isMoreFiltersOpen = ref(false)

const createOptions: { type: CreateEventType, label: string, description: string, icon: string }[] = [
  { type: 'ladv', label: 'LADV-Import', description: 'Wettkampf aus der LADV-Datenbank importieren', icon: 'i-ph-download-simple' },
  { type: 'competition', label: 'Wettkampf', description: 'Wettkampf manuell anlegen', icon: eventTypeIcons['competition'] ?? '' },
  { type: 'training', label: 'Training', description: 'Trainingstermin erstellen', icon: eventTypeIcons['training'] ?? '' },
  { type: 'social', label: 'Social', description: 'Gemeinschaftsevent anlegen', icon: eventTypeIcons['social'] ?? '' },
]

const activeFilterCount = computed(() => {
  let count = 0
  if (typeFilter.value) count++
  if (raceTypeFilter.value) count++
  if (championshipFilter.value) count++
  if (priorityFilter.value) count++
  if (wrcFilter.value) count++
  if (disciplineFilter.value) count++
  if (ageClassFilter.value) count++
  return count
})

const moreFiltersActive = computed(() =>
  !!(raceTypeFilter.value || championshipFilter.value || priorityFilter.value
    || wrcFilter.value || disciplineFilter.value || ageClassFilter.value),
)

const disciplineItems = computed(() => [
  { label: 'Alle Disziplinen', value: undefined },
  ...props.availableDisciplines.map(d => ({ label: ladvDisciplineLabel(d), value: d })),
])

const ageClassItems = computed(() => [
  { label: 'Alle Altersklassen', value: undefined },
  ...props.availableAgeClasses.map(ak => ({ label: ladvAgeClassLabel(ak), value: ak })),
])

function resetFilters() {
  typeFilter.value = undefined
  raceTypeFilter.value = undefined
  championshipFilter.value = undefined
  priorityFilter.value = undefined
  wrcFilter.value = false
  disciplineFilter.value = undefined
  ageClassFilter.value = undefined
}

async function handleCreate(type: CreateEventType) {
  isCreateModalOpen.value = false
  if (type === 'ladv') {
    await navigateTo('/events/ladv-importieren')
  }
  else {
    await navigateTo(`/events/neu?type=${type}`)
  }
}
</script>

<template>
  <div class="mb-4 flex flex-col gap-2">
    <div class="flex items-center gap-2">
      <UInput
        v-model="searchQuery"
        placeholder="Suchen..."
        icon="i-ph-magnifying-glass"
        class="flex-1 min-w-0"
      />
      <UModal
        v-if="!publicMode"
        v-model:open="isCreateModalOpen"
        title="Event erstellen"
        description="Wähle, welche Art von Event du anlegen möchtest."
      >
        <UButton
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

    <div class="flex flex-wrap items-center gap-y-2 gap-x-4">
      <!-- Typ: auf Mobile zuerst und immer sichtbar -->
      <div
        v-if="!publicMode"
        class="flex gap-1"
      >
        <UButton
          size="sm"
          :icon="eventTypeIcons['ladv']"
          variant="outline"
          :color="typeFilter === 'competition' ? 'primary' : 'neutral'"
          label="Wettkampf"
          @click="typeFilter = typeFilter === 'competition' ? undefined : 'competition'"
        />
        <UButton
          size="sm"
          :icon="eventTypeIcons['training']"
          variant="outline"
          :color="typeFilter === 'training' ? 'primary' : 'neutral'"
          label="Training"
          @click="typeFilter = typeFilter === 'training' ? undefined : 'training'"
        />
        <UButton
          size="sm"
          :icon="eventTypeIcons['social']"
          variant="outline"
          :color="typeFilter === 'social' ? 'primary' : 'neutral'"
          label="Social"
          @click="typeFilter = typeFilter === 'social' ? undefined : 'social'"
        />
      </div>

      <!-- Mobile: weiterer Filter-Toggle, rechtsbündig -->
      <UButton
        class="ml-auto sm:hidden "
        size="sm"
        variant="outline"
        :color="isMoreFiltersOpen || moreFiltersActive ? 'primary' : 'neutral'"
        icon="i-ph-funnel"
        @click="isMoreFiltersOpen = !isMoreFiltersOpen"
      />

      <!-- Restliche Filter: auf Mobile versteckt bis Toggle, auf Desktop immer via contents -->
      <div
        :class="[
          'sm:contents',
          isMoreFiltersOpen ? 'flex flex-wrap items-center gap-y-2 gap-x-4 w-full' : 'hidden',
        ]"
      >
        <div class="flex gap-1">
          <UButton
            size="sm"
            variant="outline"
            :color="timeRange === 'past' ? 'primary' : 'neutral'"
            label="Vergangene"
            @click="timeRange = timeRange === 'past' ? 'upcoming' : 'past'"
          />
          <UButton
            size="sm"
            variant="outline"
            :color="timeRange === 'upcoming' ? 'primary' : 'neutral'"
            label="Kommende"
            @click="timeRange = timeRange === 'upcoming' ? 'all' : 'upcoming'"
          />
        </div>

        <template v-if="hasRaceTypeEvents">
          <div class="flex gap-1">
            <UButton
              size="sm"
              variant="outline"
              :color="raceTypeFilter === 'track' ? 'primary' : 'neutral'"
              label="Bahn"
              @click="raceTypeFilter = raceTypeFilter === 'track' ? undefined : 'track'"
            />
            <UButton
              size="sm"
              variant="outline"
              :color="raceTypeFilter === 'road' ? 'primary' : 'neutral'"
              label="Straße"
              @click="raceTypeFilter = raceTypeFilter === 'road' ? undefined : 'road'"
            />
            <UButton
              size="sm"
              variant="outline"
              :color="raceTypeFilter === 'trail' ? 'primary' : 'neutral'"
              label="Trail"
              @click="raceTypeFilter = raceTypeFilter === 'trail' ? undefined : 'trail'"
            />
          </div>
        </template>

        <template v-if="hasChampionshipEvents">
          <div class="flex gap-1">
            <UButton
              size="sm"
              variant="outline"
              :color="championshipFilter === 'bbm' ? 'primary' : 'neutral'"
              label="BBM"
              @click="championshipFilter = championshipFilter === 'bbm' ? undefined : 'bbm'"
            />
            <UButton
              size="sm"
              variant="outline"
              :color="championshipFilter === 'ndm' ? 'primary' : 'neutral'"
              label="NDM"
              @click="championshipFilter = championshipFilter === 'ndm' ? undefined : 'ndm'"
            />
            <UButton
              size="sm"
              variant="outline"
              :color="championshipFilter === 'dm' ? 'primary' : 'neutral'"
              label="DM"
              @click="championshipFilter = championshipFilter === 'dm' ? undefined : 'dm'"
            />
          </div>
        </template>

        <template v-if="hasPriorityEvents">
          <div class="flex gap-1">
            <UButton
              size="sm"
              variant="outline"
              :color="priorityFilter === 'A' ? 'primary' : 'neutral'"
              label="A"
              @click="priorityFilter = priorityFilter === 'A' ? undefined : 'A'"
            />
            <UButton
              size="sm"
              variant="outline"
              :color="priorityFilter === 'B' ? 'primary' : 'neutral'"
              label="B"
              @click="priorityFilter = priorityFilter === 'B' ? undefined : 'B'"
            />
            <UButton
              size="sm"
              variant="outline"
              :color="priorityFilter === 'C' ? 'primary' : 'neutral'"
              label="C"
              @click="priorityFilter = priorityFilter === 'C' ? undefined : 'C'"
            />
          </div>
        </template>

        <template v-if="hasWrcEvents">
          <UButton
            size="sm"
            variant="outline"
            :color="wrcFilter ? 'primary' : 'neutral'"
            label="WRC"
            @click="wrcFilter = !wrcFilter"
          />
        </template>

        <template v-if="availableDisciplines.length > 0">
          <USelect
            v-model="disciplineFilter"
            :items="disciplineItems"
            placeholder="Disziplin"
            value-key="value"
            label-key="label"
            size="sm"
            class="w-40"
          />
        </template>

        <template v-if="availableAgeClasses.length > 0">
          <USelect
            v-model="ageClassFilter"
            :items="ageClassItems"
            placeholder="Altersklasse"
            value-key="value"
            label-key="label"
            size="sm"
            class="w-36"
          />
        </template>

        <UButton
          v-if="activeFilterCount"
          size="xs"
          color="neutral"
          variant="ghost"
          icon="i-ph-x"
          label="Zurücksetzen"
          @click="resetFilters"
        />
      </div>
    </div>
  </div>
</template>
