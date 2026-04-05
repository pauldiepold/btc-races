<script setup lang="ts">
import type { EventListItem } from '~~/shared/types/events'

const props = defineProps<{
  event: EventListItem
}>()

function toDate(val: Date | string | null | undefined): Date | null {
  if (!val) return null
  return val instanceof Date ? val : new Date(val as string)
}

const eventDate = computed(() => toDate(props.event.date))

const day = computed(() => eventDate.value?.toLocaleDateString('de-DE', { day: '2-digit' }) ?? null)
const month = computed(() => eventDate.value?.toLocaleDateString('de-DE', { month: 'short' }).replace('.', '') ?? null)

const typeLabel: Record<string, string> = {
  ladv: 'LADV',
  competition: 'Wettkampf',
  training: 'Training',
  social: 'Social',
}

type BadgeColor = 'error' | 'info' | 'primary' | 'secondary' | 'success' | 'warning' | 'neutral'

const typeColor: Record<string, BadgeColor> = {
  ladv: 'info',
  competition: 'primary',
  training: 'success',
  social: 'neutral',
}

const championshipLabel: Record<string, string> = {
  bbm: 'BBM',
  ndm: 'NDM',
  dm: 'DM',
}

const raceTypeLabel: Record<string, string> = {
  track: 'Bahn',
  road: 'Straße',
}

const showDeadline = computed(() =>
  (props.event.type === 'competition' || props.event.type === 'ladv') && !!props.event.registrationDeadline,
)

const deadlineDate = computed(() => toDate(props.event.registrationDeadline))
const deadlineExpired = computed(() => !!deadlineDate.value && deadlineDate.value < new Date())
const deadlineLabel = computed(() => {
  if (!deadlineDate.value) return ''
  return `Meldeschluss ${deadlineDate.value.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}`
})

const registrationStatusConfig: Record<string, { icon: string, label: string, color: BadgeColor }> = {
  registered: { icon: 'i-ph-check-circle', label: 'Angemeldet', color: 'success' },
  canceled: { icon: 'i-ph-x-circle', label: 'Abgemeldet', color: 'error' },
  maybe: { icon: 'i-ph-question', label: 'Vielleicht', color: 'warning' },
  yes: { icon: 'i-ph-check-circle', label: 'Dabei', color: 'success' },
  no: { icon: 'i-ph-x-circle', label: 'Nicht dabei', color: 'neutral' },
}

const ownRegistration = computed(() =>
  props.event.ownRegistrationStatus ? registrationStatusConfig[props.event.ownRegistrationStatus] : null,
)
</script>

<template>
  <NuxtLink
    :to="`/events/${event.id}`"
    class="group flex items-center gap-4 px-4 py-4 rounded-[--ui-radius] border border-default bg-muted hover:bg-accented hover:border-accented transition-all duration-150"
    :class="{ 'opacity-50': event.cancelledAt }"
  >
    <!-- Datum-Block -->
    <div class="shrink-0 flex flex-col items-center w-10 gap-0.5">
      <span class="text-base font-bold text-highlighted tabular-nums leading-none">
        {{ day ?? '--' }}
      </span>
      <span
        v-if="month"
        class="text-xs text-muted uppercase tracking-wide"
      >{{ month }}</span>
    </div>

    <!-- Trennlinie -->
    <div class="w-px h-9 bg-border shrink-0" />

    <!-- Event-Infos -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-sm font-medium text-highlighted truncate">{{ event.name }}</span>
        <UBadge
          v-if="event.cancelledAt"
          label="Abgesagt"
          color="error"
          variant="subtle"
          size="xs"
        />
        <UBadge
          v-if="event.isWrc"
          icon="i-ph-trophy"
          label="WRC"
          color="primary"
          variant="subtle"
          size="xs"
        />
      </div>
      <div class="flex items-center gap-3 mt-1 flex-wrap">
        <span
          v-if="event.location"
          class="text-xs text-muted flex items-center gap-1"
        >
          <UIcon
            name="i-ph-map-pin"
            class="size-3"
          />
          {{ event.location }}
        </span>
        <span class="text-xs text-muted flex items-center gap-1">
          <UIcon
            name="i-ph-users"
            class="size-3"
          />
          {{ event.participantCount }}
        </span>
        <UBadge
          v-if="event.raceType"
          :label="raceTypeLabel[event.raceType]"
          color="neutral"
          variant="outline"
          size="xs"
        />
        <UBadge
          v-if="event.championshipType && event.championshipType !== 'none'"
          :label="championshipLabel[event.championshipType]"
          color="neutral"
          variant="subtle"
          size="xs"
        />
        <span
          v-if="showDeadline"
          class="text-xs flex items-center gap-1"
          :class="deadlineExpired ? 'text-red-400' : 'text-muted'"
        >
          <UIcon
            name="i-ph-clock"
            class="size-3"
          />
          {{ deadlineLabel }}
        </span>
      </div>
    </div>

    <!-- Rechts: Typ-Badge + Status + Details-Button -->
    <div class="shrink-0 hidden sm:flex items-center gap-2">
      <UBadge
        v-if="ownRegistration"
        :icon="ownRegistration.icon"
        :label="ownRegistration.label"
        :color="ownRegistration.color"
        variant="subtle"
        size="xs"
      />
      <UBadge
        :label="typeLabel[event.type]"
        :color="typeColor[event.type]"
        variant="subtle"
        size="sm"
      />
      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        trailing-icon="i-ph-arrow-right"
        label="Details"
        tabindex="-1"
      />
    </div>
  </NuxtLink>
</template>
