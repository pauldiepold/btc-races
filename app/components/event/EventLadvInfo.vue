<script setup lang="ts">
import type { LadvAusschreibung } from '~~/shared/types/ladv'

const props = defineProps<{
  data: LadvAusschreibung
  lastSync?: Date | string | null
}>()

const disciplineGroups = computed(() => {
  const groups = new Map<string, string[]>()
  for (const w of props.data.wettbewerbe ?? []) {
    const key = w.disziplinNew
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(w.klasseNew)
  }
  return [...groups.entries()].map(([code, akCodes]) => ({
    code,
    label: ladvDisciplineLabel(code),
    akCodes,
  }))
})

const openDisciplines = ref<string[]>([])

function isOpen(code: string) {
  return openDisciplines.value.includes(code)
}

function toggle(code: string) {
  if (isOpen(code)) {
    openDisciplines.value = openDisciplines.value.filter(c => c !== code)
  }
  else {
    openDisciplines.value.push(code)
  }
}
</script>

<template>
  <div class="space-y-5">
    <!-- Abschnittstitel -->
    <div class="flex items-center justify-between gap-4">
      <h2 class="font-semibold text-highlighted">
        LADV-Informationen
      </h2>
      <span
        v-if="lastSync"
        class="flex items-center gap-1 text-xs text-muted"
      >
        <UIcon
          name="i-ph-arrows-clockwise"
          class="size-3.5"
        />
        Sync: {{ formatDateTime(lastSync) }}
      </span>
    </div>

    <!-- Org-Details -->
    <div
      v-if="data.veranstalter || data.ausrichter || data.sportstaette"
      class="grid grid-cols-1 gap-y-3 sm:grid-cols-2 sm:gap-x-6 text-sm"
    >
      <div v-if="data.veranstalter">
        <p class="text-xs text-muted mb-0.5">
          Veranstalter
        </p>
        <p class="text-highlighted">
          {{ data.veranstalter }}
        </p>
      </div>
      <div v-if="data.ausrichter && data.ausrichter !== data.veranstalter">
        <p class="text-xs text-muted mb-0.5">
          Ausrichter
        </p>
        <p class="text-highlighted">
          {{ data.ausrichter }}
        </p>
      </div>
      <div v-if="data.sportstaette">
        <p class="text-xs text-muted mb-0.5">
          Sportstätte
        </p>
        <p class="text-highlighted">
          {{ data.sportstaette }}
        </p>
      </div>
    </div>

    <!-- LADV-Beschreibung -->
    <div
      v-if="data.beschreibung"
      class="text-sm text-muted leading-relaxed"
      v-text="data.beschreibung"
    />

    <!-- Wettbewerbe -->
    <div v-if="disciplineGroups.length">
      <p class="text-xs text-muted uppercase tracking-widest mb-3">
        Wettbewerbe
      </p>
      <div class="divide-y divide-default border border-default rounded-[--ui-radius]">
        <div
          v-for="group in disciplineGroups"
          :key="group.code"
        >
          <!-- Disziplin-Zeile -->
          <button
            :id="`discipline-btn-${group.code}`"
            type="button"
            :aria-expanded="isOpen(group.code)"
            :aria-controls="`discipline-panel-${group.code}`"
            class="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-elevated/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            @click="toggle(group.code)"
          >
            <span class="text-sm font-medium text-highlighted">{{ group.label }}</span>
            <div class="flex items-center gap-2 shrink-0">
              <span class="text-xs text-muted">{{ group.akCodes.length }} AK</span>
              <UIcon
                name="i-ph-caret-down"
                class="size-4 text-muted transition-transform duration-200 ease-out"
                :class="isOpen(group.code) ? 'rotate-180' : ''"
              />
            </div>
          </button>

          <!-- AK-Liste mit grid-template-rows Transition -->
          <div
            :id="`discipline-panel-${group.code}`"
            class="grid transition-[grid-template-rows] duration-200 ease-out"
            :style="{ gridTemplateRows: isOpen(group.code) ? '1fr' : '0fr' }"
          >
            <div class="overflow-hidden">
              <div class="px-4 pb-3 flex flex-wrap gap-1.5">
                <LadvBadge
                  v-for="ak in group.akCodes"
                  :key="ak"
                  :age-class="ak"
                  variant="subtle"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
