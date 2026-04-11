<script setup lang="ts">
type CreateEventType = 'ladv' | 'competition' | 'training' | 'social'

const searchQuery = defineModel<string>('searchQuery', { required: true })
const timeRange = defineModel<string>('timeRange', { required: true })
const typeFilter = defineModel<string | undefined>('typeFilter')
const raceTypeFilter = defineModel<'track' | 'road' | undefined>('raceTypeFilter')
const championshipFilter = defineModel<'bbm' | 'ndm' | 'dm' | undefined>('championshipFilter')
const priorityFilter = defineModel<'A' | 'B' | 'C' | undefined>('priorityFilter')

const props = defineProps<{
  hasRaceTypeEvents: boolean
  hasChampionshipEvents: boolean
  hasPriorityEvents: boolean
  publicMode?: boolean
}>()

const typeFilterItems = computed(() => {
  if (props.publicMode) {
    return [
      { label: 'Alle Events', value: undefined },
      { label: 'LADV', value: 'ladv' },
      { label: 'Wettkampf', value: 'competition' },
    ]
  }
  return [
    { label: 'Alle Events', value: undefined },
    { label: 'LADV', value: 'ladv' },
    { label: 'Wettkampf', value: 'competition' },
    { label: 'Training', value: 'training' },
    { label: 'Social', value: 'social' },
  ]
})

const isCreateModalOpen = ref(false)
const isFilterPopoverOpen = ref(false)

const createOptions: { type: CreateEventType, label: string, description: string, icon: string }[] = [
  { type: 'ladv', label: 'LADV-Import', description: 'Wettkampf aus der LADV-Datenbank importieren', icon: 'i-ph-download-simple' },
  { type: 'competition', label: 'Wettkampf', description: 'Wettkampf manuell anlegen', icon: 'i-ph-trophy' },
  { type: 'training', label: 'Training', description: 'Trainingstermin erstellen', icon: 'i-ph-lightning' },
  { type: 'social', label: 'Social', description: 'Gemeinschaftsevent anlegen', icon: 'i-ph-confetti' },
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

const activeSecondaryFilterCount = computed(() => {
  let count = 0
  if (typeFilter.value) count++
  if (raceTypeFilter.value) count++
  if (championshipFilter.value) count++
  if (priorityFilter.value) count++
  return count
})

function resetSecondaryFilters() {
  typeFilter.value = undefined
  raceTypeFilter.value = undefined
  championshipFilter.value = undefined
  priorityFilter.value = undefined
  isFilterPopoverOpen.value = false
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
  <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
    <div
      v-if="!publicMode"
      class="flex justify-end sm:order-last sm:ml-auto"
    >
      <UModal
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
    <UInput
      v-model="searchQuery"
      placeholder="Suchen..."
      icon="i-ph-magnifying-glass"
      class="flex-1 min-w-0 sm:order-first"
    />
    <div class="flex items-center gap-2">
      <USelect
        v-model="timeRange"
        :items="timeRangeItems"
        value-key="value"
        label-key="label"
        class="flex-1 sm:w-36 sm:flex-none"
      />
      <UPopover v-model:open="isFilterPopoverOpen">
        <UButton
          :color="activeSecondaryFilterCount ? 'primary' : 'neutral'"
          variant="outline"
          icon="i-ph-funnel"
          :label="activeSecondaryFilterCount ? `Filtern (${activeSecondaryFilterCount})` : 'Filtern'"
        />
        <template #content>
          <div class="p-3 w-64 space-y-3">
            <div class="space-y-1.5">
              <p class="text-xs font-medium text-muted uppercase tracking-widest">
                Typ
              </p>
              <USelect
                v-model="typeFilter"
                :items="typeFilterItems"
                placeholder="Alle Events"
                value-key="value"
                label-key="label"
                class="w-full"
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
                value-key="value"
                label-key="label"
                class="w-full"
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
                value-key="value"
                label-key="label"
                class="w-full"
              />
            </div>
            <div
              v-if="hasPriorityEvents"
              class="space-y-1.5"
            >
              <p class="text-xs font-medium text-muted uppercase tracking-widest">
                Priorität
              </p>
              <USelect
                v-model="priorityFilter"
                :items="[
                  { label: 'Alle', value: undefined },
                  { label: 'A-Rennen', value: 'A' },
                  { label: 'B-Rennen', value: 'B' },
                  { label: 'C-Rennen', value: 'C' },
                ]"
                placeholder="Alle"
                value-key="value"
                label-key="label"
                class="w-full"
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
    </div>
  </div>
</template>
