<script setup lang="ts">
import type { Database } from '~/types/database.types'

type Competition = Database['public']['Tables']['competitions']['Row']

const props = defineProps<{
  competition: Competition
}>()

// Hilfsfunktion für Datumsprüfung
function isEventInPast(date: string) {
  if (!date) return false
  const eventDate = new Date(date)
  eventDate.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return eventDate < today
}

const status = computed(() => getCompetitionStatus(props.competition))
</script>

<template>
  <div
    class="overflow-hidden rounded-lg bg-white shadow-md transition-shadow duration-300 hover:shadow-lg"
  >
    <div class="p-6">
      <div class="flex items-center gap-3">
        <h3 class="text-lg font-semibold text-gray-900">
          {{ competition.name }}
        </h3>
        <span
          class="100 rounded-full px-4 py-1 text-xs font-medium"
          :class="status.color"
        >
          {{ status.text }}
        </span>
      </div>
      <div class="mt-3 grid grid-cols-2 gap-4">
        <div class="flex items-center gap-2">
          <Icon name="mdi:calendar-outline" class="h-4 w-4 text-gray-400" />
          <span class="text-sm text-gray-600">
            {{ new Date(competition.date).toLocaleDateString('de-DE') }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <Icon name="mdi:location-on-outline" class="h-4 w-4 text-gray-400" />
          <span class="text-sm text-gray-600">{{ competition.location }}</span>
        </div>
        <div class="flex items-center gap-2">
          <Icon
            name="mdi:clock-time-five-outline"
            class="h-4 w-4 text-gray-400"
          />
          <span class="text-sm text-gray-600">
            Anmeldeschluss:
            {{
              new Date(competition.registration_deadline).toLocaleDateString(
                'de-DE'
              )
            }}
          </span>
        </div>

        <div
          v-if="competition.announcement_link"
          class="-my-2 flex items-center justify-between"
        >
          <div class="flex gap-2">
            <a
              :href="competition.announcement_link"
              target="_blank"
              class="inline-flex items-center rounded-full bg-indigo-50 px-4 py-1 text-sm font-medium text-indigo-600 transition-colors duration-200 hover:bg-indigo-100"
            >
              Ausschreibung
              <Icon name="mdi:external-link" class="ml-1 h-4 w-4" />
            </a>
          </div>
        </div>
        <div class="col-span-2 mt-2 flex justify-start gap-4">
          <BaseLink :to="`/competitions/${competition.id}`" variant="outline">
            Anmelden
          </BaseLink>
          <BaseLink :to="`/competitions/${competition.id}`">
            Details ansehen
          </BaseLink>
        </div>
      </div>
    </div>
  </div>
</template>
