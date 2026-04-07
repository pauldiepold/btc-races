<script setup lang="ts">
import type { RegistrationDetail } from '~~/shared/types/events'
import { REGISTRATION_STATUS_BADGE_COLORS, getRegistrationTabConfig } from '~~/shared/utils/registration-ui'

const props = defineProps<{
  registrations: RegistrationDetail[]
  eventType: 'ladv' | 'competition' | 'training' | 'social'
}>()

type TabKey = 'registered' | 'canceled' | 'maybe' | 'yes' | 'no'

const tabConfig = computed(() =>
  getRegistrationTabConfig(props.eventType) as { key: TabKey, label: string }[],
)

const byStatus = computed(() =>
  Object.fromEntries(
    tabConfig.value.map(tab => [
      tab.key,
      props.registrations.filter(r => r.status === tab.key),
    ]),
  ),
)

const tabItems = computed(() =>
  tabConfig.value.map(tab => ({
    label: tab.label,
    value: tab.key,
    badge: {
      label: `${byStatus.value[tab.key]!.length}`,
      color: REGISTRATION_STATUS_BADGE_COLORS[tab.key] ?? 'neutral',
      size: 'md' as const,
      variant: 'outline' as const,
    },
  })),
)

const activeTab = ref(tabConfig.value[0]!.key)

const activeRegistrations = computed(
  () => byStatus.value[activeTab.value] ?? [],
)

function fullName(r: RegistrationDetail): string {
  return [r.firstName, r.lastName].filter(Boolean).join(' ') || 'Unbekannt'
}
</script>

<template>
  <div>
    <h2 class="font-display font-semibold text-highlighted mb-4">
      Anmeldungen
    </h2>

    <!-- Globaler Leer-Zustand -->
    <div
      v-if="registrations.length === 0"
      class="py-10 text-center text-sm text-muted"
    >
      <UIcon
        name="i-ph-users"
        class="size-8 mx-auto mb-2 opacity-40"
      />
      <p>Noch keine Anmeldungen.</p>
    </div>

    <template v-else>
      <UTabs
        v-model="activeTab"
        :items="tabItems"
        :content="false"
        color="neutral"
        variant="link"
        class="mb-4"
        :ui="{ label: 'font-semibold', list: 'max-sm:w-full max-sm:justify-around' }"
      />

      <!-- Tab-Inhalt -->
      <div
        v-if="activeRegistrations.length === 0"
        class="py-8 text-center text-sm text-muted"
      >
        <UIcon
          name="i-ph-users-three"
          class="size-6 mx-auto mb-2 opacity-40"
        />
        <p>Noch niemand in dieser Gruppe.</p>
      </div>

      <div
        v-else
        class="divide-y divide-default"
      >
        <div
          v-for="reg in activeRegistrations"
          :key="reg.id"
          class="flex items-start gap-3 py-3"
        >
          <!-- Avatar-Initiale -->
          <div class="shrink-0 size-8 rounded-full bg-accented flex items-center justify-center text-xs font-semibold text-highlighted mt-0.5">
            {{ (reg.firstName?.[0] ?? reg.lastName?.[0] ?? '?').toUpperCase() }}
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-sm font-medium text-highlighted">{{ fullName(reg) }}</span>
            </div>

            <!-- Disziplinen (LADV) -->
            <div
              v-if="reg.disciplines.length"
              class="flex flex-wrap gap-1 mt-1.5"
            >
              <LadvBadge
                v-for="d in reg.disciplines"
                :key="d.id"
                :discipline="d.discipline"
              />
            </div>

            <p
              v-if="reg.notes"
              class="text-xs text-muted mt-1 italic"
            >
              {{ reg.notes }}
            </p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
