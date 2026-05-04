<script setup lang="ts">
import type { EventListItem, EventListPublicItem } from '~~/shared/types/events'

const props = defineProps<{
  event: EventListItem | EventListPublicItem
}>()

const eventDate = computed(() => toDate(props.event.date))

const weekday = computed(() => eventDate.value?.toLocaleDateString('de-DE', { weekday: 'short' }).replace('.', '') ?? null)
const day = computed(() => eventDate.value?.toLocaleDateString('de-DE', { day: '2-digit' }) ?? null)
const month = computed(() => eventDate.value?.toLocaleDateString('de-DE', { month: 'short' }).replace('.', '') ?? null)

type BadgeColor = 'error' | 'info' | 'primary' | 'secondary' | 'success' | 'warning' | 'neutral'

const hasDeadline = computed(() =>
  (props.event.type === 'competition' || props.event.type === 'ladv') && !!props.event.registrationDeadline,
)

const deadlineDate = computed(() => toDate(props.event.registrationDeadline))
const deadlineExpired = computed(() => !!deadlineDate.value && deadlineDate.value < new Date())
const compactLocation = computed(() => {
  const location = props.event.location
  if (!location) return null

  const [first, second] = location.split('·').map(s => s.trim())

  return second || first || null
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
    <div class="shrink-0 flex flex-col items-center w-10">
      <span
        v-if="weekday"
        class="text-[10px] text-muted uppercase tracking-wide leading-none"
      >{{ weekday }}</span>
      <span class="text-base font-bold text-highlighted leading-none mt-1.5 font-numeric">
        {{ day ?? '--' }}
      </span>
      <span
        v-if="month"
        class="text-[10px] text-primary uppercase tracking-wide leading-none mt-0.5"
      >{{ month }}</span>
      <span
        v-if="event.startTime"
        class="text-[10px] text-muted leading-none mt-1.5 font-numeric"
      >{{ event.startTime }}</span>
    </div>

    <!-- Trennlinie -->
    <div class="w-px self-stretch my-1 bg-border group-hover:bg-primary shrink-0 transition-colors duration-150" />

    <!-- Event-Infos -->
    <div class="flex-1 min-w-0">
      <!-- Titel-Zeile: Typ-Icon + Name + Abgesagt -->
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
      </div>
      <!-- Zeile 2: Teilnehmer + Ort -->
      <div
        v-if="compactLocation || 'ownRegistrationStatus' in event"
        class="flex items-center gap-2 mt-1.5 text-xs text-muted"
      >
        <span
          v-if="'ownRegistrationStatus' in event"
          class="flex items-center gap-1"
        >
          <UIcon
            name="i-ph-users"
            class="size-3"
          />
          {{ event.participantCount }}
        </span>
        <span
          v-if="compactLocation"
          class="flex items-center gap-1"
        >
          <UIcon
            name="i-ph-map-pin"
            class="size-3"
          />
          {{ compactLocation }}
        </span>
      </div>
      <!-- Zeile 3: Typ-Badges + Anmeldestatus -->
      <div
        v-if="event.priority || event.raceType || (event.championshipType && event.championshipType !== 'none') || ownRegistration || (hasDeadline && !deadlineExpired)"
        class="flex items-center gap-2 mt-1.5 flex-wrap"
      >
        <EventPriorityBadge :priority="event.priority" />
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
        <UBadge
          v-if="ownRegistration"
          :icon="ownRegistration.icon"
          :label="ownRegistration.label"
          :color="ownRegistration.color"
          variant="subtle"
          size="xs"
        />
        <UBadge
          v-else-if="hasDeadline && !deadlineExpired"
          label="Offen"
          color="success"
          variant="subtle"
          size="xs"
        />
      </div>
    </div>
  </NuxtLink>
</template>
