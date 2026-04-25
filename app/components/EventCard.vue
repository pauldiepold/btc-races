<script setup lang="ts">
import type { EventListItem, EventListPublicItem } from '~~/shared/types/events'

const props = defineProps<{
  event: EventListItem | EventListPublicItem
}>()

const eventDate = computed(() => toDate(props.event.date))

const day = computed(() => eventDate.value?.toLocaleDateString('de-DE', { day: '2-digit' }) ?? null)
const month = computed(() => eventDate.value?.toLocaleDateString('de-DE', { month: 'short' }).replace('.', '') ?? null)

type BadgeColor = 'error' | 'info' | 'primary' | 'secondary' | 'success' | 'warning' | 'neutral'

const hasDeadline = computed(() =>
  (props.event.type === 'competition' || props.event.type === 'ladv') && !!props.event.registrationDeadline,
)

const deadlineDate = computed(() => toDate(props.event.registrationDeadline))
const deadlineExpired = computed(() => !!deadlineDate.value && deadlineDate.value < new Date())
const compactLocation = computed(() => {
  if (!props.event.location) return null
  return props.event.location.split(' · ')[0]?.trim() ?? null
})

const registrationStatusConfig: Record<string, { icon: string, label: string, color: BadgeColor }> = {
  registered: { icon: 'i-ph-check-circle', label: 'Angemeldet', color: 'success' },
  canceled: { icon: 'i-ph-x-circle', label: 'Abgemeldet', color: 'error' },
  maybe: { icon: 'i-ph-question', label: 'Vielleicht', color: 'warning' },
  yes: { icon: 'i-ph-check-circle', label: 'Dabei', color: 'success' },
  no: { icon: 'i-ph-x-circle', label: 'Nicht dabei', color: 'neutral' },
}

const ownRegistration = computed(() => {
  const status = 'ownRegistrationStatus' in props.event ? props.event.ownRegistrationStatus : null
  return status ? registrationStatusConfig[status] : null
})
</script>

<template>
  <NuxtLink
    :to="`/${event.id}`"
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
        class="text-xs text-primary uppercase tracking-wide"
      >{{ month }}</span>
      <span
        v-if="event.startTime"
        class="text-xs text-muted tabular-nums"
      >{{ event.startTime }}</span>
    </div>

    <!-- Trennlinie -->
    <div class="w-px self-stretch my-1 bg-border group-hover:bg-primary shrink-0 transition-colors duration-150" />

    <!-- Event-Infos -->
    <div class="flex-1 min-w-0">
      <!-- Titel-Zeile: Typ-Icon + Name + Anmeldestatus (rechts) -->
      <div class="flex items-center gap-2">
        <UIcon
          :name="eventTypeIcons[event.type]"
          class="size-4 text-muted shrink-0"
        />
        <span class="text-sm font-medium text-highlighted">{{ event.name }}</span>
        <UBadge
          v-if="event.cancelledAt"
          label="Abgesagt"
          color="error"
          variant="subtle"
          size="xs"
          class="shrink-0"
        />
        <UBadge
          v-if="ownRegistration"
          :icon="ownRegistration.icon"
          :label="ownRegistration.label"
          :color="ownRegistration.color"
          variant="subtle"
          size="xs"
          class="ml-auto shrink-0"
        />
        <UBadge
          v-else-if="hasDeadline && !deadlineExpired"
          label="Offen"
          color="success"
          variant="subtle"
          size="xs"
          class="ml-auto shrink-0"
        />
      </div>
      <!-- Meta-Zeile: Priorität, Ort, Typ-Details -->
      <div class="flex items-center gap-3 mt-2 flex-wrap">
        <EventPriorityBadge :priority="event.priority" />
        <span
          v-if="compactLocation"
          class="text-xs text-muted flex items-center gap-1"
        >
          <UIcon
            name="i-ph-map-pin"
            class="size-3"
          />
          {{ compactLocation }}
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
          :label="eventRaceTypeLabels[event.raceType]"
          color="neutral"
          variant="outline"
          size="xs"
        />
        <UBadge
          v-if="event.championshipType && event.championshipType !== 'none'"
          :label="eventChampionshipLabels[event.championshipType]"
          color="neutral"
          variant="subtle"
          size="xs"
        />
      </div>
    </div>
  </NuxtLink>
</template>
