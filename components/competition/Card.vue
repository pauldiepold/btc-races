<script setup lang="ts">
import type { Database } from '~/types/database.types'

type Competition = Database['public']['Tables']['competitions']['Row']

defineProps<{
  competition: Competition
}>()

// Hilfsfunktion für Datumsprüfung
function isEventInPast(date: string) {
  if (!date)
    return false
  const eventDate = new Date(date)
  eventDate.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return eventDate < today
}
</script>

<template>
  <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
    <div class="p-6">
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <div class="flex items-center gap-3">
            <h3 class="text-lg font-semibold text-gray-900">
              {{ competition.name }}
            </h3>
            <span
              v-if="isEventInPast(competition.date)"
              class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full"
            >
              Vergangen
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
              <Icon name="mdi:clock-time-five-outline" class="h-4 w-4 text-gray-400" />
              <span class="text-sm text-gray-600">
                Anmeldeschluss: {{ new Date(competition.registration_deadline).toLocaleDateString('de-DE') }}
              </span>
            </div>

            <div v-if="competition.announcement_link" class="flex justify-between items-center">
              <div class="flex gap-2">
                <a
                  :href="competition.announcement_link"
                  target="_blank"
                  class="inline-flex items-center px-3 py-1 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-full hover:bg-indigo-100 transition-colors duration-200"
                >
                  Ausschreibung
                  <Icon name="mdi:external-link" class="h-4 w-4 ml-1" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
