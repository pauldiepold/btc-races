<script setup lang="ts">
import type { BadgeColor } from '~~/shared/utils/registration-ui'
import type { EventPublicRegistrationCounts, RegistrationDetail } from '~~/shared/types/events'
import { getRegistrationLadvIndicator, type LadvIndicator } from '~~/shared/utils/ladv-diff'
import { REGISTRATION_STATUS_BADGE_COLORS, getRegistrationTabConfig } from '~~/shared/utils/registration-ui'

const props = defineProps<{
  registrations?: RegistrationDetail[]
  eventType: 'ladv' | 'competition' | 'training' | 'social'
  publicMode?: boolean
  registrationCounts?: EventPublicRegistrationCounts
}>()

const emit = defineEmits<{ refresh: [] }>()

const route = useRoute()
const { session } = useUserSession()
const isAdmin = computed(() =>
  session.value?.user?.role === 'admin' || session.value?.user?.role === 'superuser',
)
const openRegistrationId = ref<number | null>(null)

const showAdminLadvUi = computed(() =>
  isAdmin.value && props.eventType === 'ladv' && !props.publicMode,
)

const LADV_INDICATOR_META: Record<LadvIndicator, {
  color: BadgeColor
  icon: string
  label: string
  tooltip: string
}> = {
  ok: {
    color: 'success',
    icon: 'i-ph-check-circle',
    label: 'LADV ok',
    tooltip: 'Wunsch- und LADV-Stand stimmen überein.',
  },
  diff: {
    color: 'warning',
    icon: 'i-ph-warning-circle',
    label: 'Diff',
    tooltip: 'Wunsch- und LADV-Stand weichen ab — Coach-Aktion offen.',
  },
  pending: {
    color: 'error',
    icon: 'i-ph-x-circle',
    label: 'Abmelden offen',
    tooltip: 'Athlet ist abgemeldet, in LADV aber noch eingetragen.',
  },
  none: {
    color: 'neutral',
    icon: 'i-ph-circle-dashed',
    label: 'Kein Stand',
    tooltip: 'Noch kein LADV-Stand erfasst.',
  },
}

const SUMMARY_ORDER: LadvIndicator[] = ['ok', 'diff', 'pending', 'none']

const summaryCounts = computed<Record<LadvIndicator, number>>(() => {
  const counts: Record<LadvIndicator, number> = { none: 0, ok: 0, diff: 0, pending: 0 }
  for (const reg of props.registrations ?? []) {
    counts[getRegistrationLadvIndicator(reg)] += 1
  }
  return counts
})

type TabKey = 'registered' | 'canceled' | 'maybe' | 'yes' | 'no'

const tabConfig = computed(() =>
  getRegistrationTabConfig(props.eventType) as { key: TabKey, label: string }[],
)

const byStatus = computed(() =>
  Object.fromEntries(
    tabConfig.value.map(tab => [
      tab.key,
      (props.registrations ?? []).filter(r => r.status === tab.key),
    ]),
  ),
)

const tabItems = computed(() =>
  tabConfig.value.map(tab => ({
    label: tab.label,
    value: tab.key,
    badge: {
      label: props.publicMode
        ? `${props.registrationCounts?.[tab.key] ?? 0}`
        : `${byStatus.value[tab.key]!.length}`,
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

const totalCount = computed(() => {
  if (props.publicMode) {
    return Object.values(props.registrationCounts ?? {}).reduce((sum, n) => sum + (n ?? 0), 0)
  }
  return (props.registrations ?? []).length
})

function fullName(r: RegistrationDetail): string {
  return [r.firstName, r.lastName].filter(Boolean).join(' ') || 'Unbekannt'
}

function ladvIndicatorMeta(reg: RegistrationDetail) {
  return LADV_INDICATOR_META[getRegistrationLadvIndicator(reg)]
}
</script>

<template>
  <div>
    <h2 class="font-display font-semibold text-highlighted mb-4">
      Anmeldungen
    </h2>

    <!-- LADV-Status-Summary (Admin + LADV-Event) -->
    <div
      v-if="showAdminLadvUi && (registrations?.length ?? 0) > 0"
      class="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted"
    >
      <template
        v-for="(indicator, idx) in SUMMARY_ORDER"
        :key="indicator"
      >
        <span
          v-if="idx > 0"
          class="text-muted/50 select-none"
        >·</span>
        <span class="inline-flex items-center gap-1.5">
          <UIcon
            :name="LADV_INDICATOR_META[indicator].icon"
            :class="[
              'size-4',
              indicator === 'ok' ? 'text-success' : '',
              indicator === 'diff' ? 'text-warning' : '',
              indicator === 'pending' ? 'text-error' : '',
              indicator === 'none' ? 'text-muted' : '',
            ]"
          />
          <span class="text-highlighted font-medium tabular-nums">{{ summaryCounts[indicator] }}</span>
          <span>{{ LADV_INDICATOR_META[indicator].label }}</span>
        </span>
      </template>
    </div>

    <!-- Globaler Leer-Zustand -->
    <div
      v-if="totalCount === 0"
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

      <!-- Public Mode: Login-CTA statt Personenliste -->
      <div
        v-if="publicMode"
        class="py-8 text-center text-sm text-muted space-y-3"
      >
        <UIcon
          name="i-ph-lock"
          class="size-6 mx-auto opacity-40"
        />
        <p>Nur für eingeloggte Mitglieder sichtbar.</p>
        <UButton
          :to="`/login?redirect=${encodeURIComponent(route.fullPath)}`"
          label="Jetzt einloggen"
          color="primary"
          variant="outline"
          size="sm"
        />
      </div>

      <template v-else>
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
            :class="isAdmin && eventType === 'ladv' ? 'cursor-pointer hover:bg-elevated/50 rounded-lg px-2 -mx-2 transition-colors' : ''"
            @click="isAdmin && eventType === 'ladv' ? openRegistrationId = reg.id : undefined"
          >
            <UAvatar
              :src="reg.hasAvatar ? useAvatarUrl(reg.userId) : undefined"
              :alt="`${reg.firstName ?? ''} ${reg.lastName ?? ''}`"
              size="sm"
              class="mt-0.5 shrink-0"
            />

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-sm font-medium text-highlighted">{{ fullName(reg) }}</span>
                <UTooltip
                  v-if="showAdminLadvUi"
                  :text="ladvIndicatorMeta(reg).tooltip"
                >
                  <UBadge
                    :icon="ladvIndicatorMeta(reg).icon"
                    :label="ladvIndicatorMeta(reg).label"
                    :color="ladvIndicatorMeta(reg).color"
                    variant="subtle"
                    size="xs"
                  />
                </UTooltip>
              </div>

              <!-- Disziplinen (LADV) -->
              <div
                v-if="reg.wishDisciplines.length"
                class="flex flex-wrap gap-1 mt-1.5"
              >
                <LadvBadge
                  v-for="d in reg.wishDisciplines"
                  :key="d.discipline"
                  :discipline="d.discipline"
                  :age-class="d.ageClass"
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
    </template>
  </div>

  <RegistrationCoachModal
    v-if="openRegistrationId"
    :registration-id="openRegistrationId"
    :open="!!openRegistrationId"
    @update:open="!$event && (openRegistrationId = null)"
    @done="openRegistrationId = null; emit('refresh')"
  />
</template>
