<script setup lang="ts">
import type { EventDetail } from '~~/shared/types/events'

const props = defineProps<{ event: EventDetail }>()

const eventDate = computed(() => toDate(props.event.date))
const deadlineDate = computed(() => toDate(props.event.registrationDeadline))
const deadlineExpired = computed(() => !!deadlineDate.value && deadlineDate.value < new Date())
const isCancelled = computed(() => !!props.event.cancelledAt)
const showDeadline = computed(() =>
  (props.event.type === 'competition' || props.event.type === 'ladv') && !!deadlineDate.value,
)
</script>

<template>
  <div class="pb-6 border-b border-default">
    <div class="flex items-start gap-4 flex-wrap">
      <!-- Datum-Block -->
      <div
        v-if="eventDate"
        class="shrink-0 flex flex-col items-center w-12 pt-1 gap-0.5"
      >
        <span class="text-2xl font-bold text-highlighted tabular-nums leading-none">
          {{ eventDate.toLocaleDateString('de-DE', { day: '2-digit' }) }}
        </span>
        <span class="text-xs text-muted uppercase tracking-wide">
          {{ eventDate.toLocaleDateString('de-DE', { month: 'short' }).replace('.', '') }}
        </span>
      </div>

      <div class="flex-1 min-w-0">
        <!-- Name + Badges -->
        <div class="flex flex-wrap items-center gap-2 mb-2">
          <h1 class="font-display text-2xl font-bold tracking-tight text-highlighted">
            {{ event.name }}
          </h1>
          <UBadge
            v-if="isCancelled"
            label="Abgesagt"
            color="error"
            variant="subtle"
          />
          <UBadge
            v-if="event.isWrc"
            icon="i-ph-trophy"
            label="WRC"
            color="primary"
            variant="subtle"
          />
          <UBadge
            :label="eventTypeLabels[event.type]"
            :color="eventTypeColors[event.type]"
            variant="subtle"
          />
        </div>

        <!-- Meta-Zeile -->
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
          <span
            v-if="event.location"
            class="flex items-center gap-1"
          >
            <UIcon
              name="i-ph-map-pin"
              class="size-4"
            />
            {{ event.location }}
          </span>
          <span
            v-if="showDeadline"
            class="flex items-center gap-1"
            :class="deadlineExpired ? 'text-red-600 dark:text-red-400' : ''"
          >
            <UIcon
              name="i-ph-clock"
              class="size-4"
            />
            Meldeschluss {{ formatDate(deadlineDate) }}
            <span v-if="deadlineExpired">(abgelaufen)</span>
          </span>
          <span
            v-if="event.raceType"
            class="flex items-center gap-1"
          >
            <UIcon
              name="i-ph-flag"
              class="size-4"
            />
            {{ eventRaceTypeLabels[event.raceType] }}
          </span>
          <UBadge
            v-if="event.championshipType && event.championshipType !== 'none'"
            :label="eventChampionshipLabels[event.championshipType]"
            color="neutral"
            variant="subtle"
            size="xs"
          />
        </div>
      </div>
    </div>

    <!-- Beschreibung -->
    <p
      v-if="event.description"
      class="mt-4 text-sm text-muted leading-relaxed"
    >
      {{ event.description }}
    </p>
  </div>
</template>
