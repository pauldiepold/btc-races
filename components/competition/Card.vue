<script setup lang="ts">
import type { Database } from '~/types/database.types'

type Competition = Database['public']['Tables']['competitions']['Row']

defineProps<{ competition: Competition }>()
</script>

<template>
  <NuxtLink
    :to="`/competitions/${competition.id}`"
    class="block overflow-hidden rounded-lg bg-white shadow-md transition-all duration-300 hover:shadow-lg"
  >
    <div class="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
      <div
        class="flex flex-col gap-2 md:col-span-2 md:flex-row md:items-center md:gap-4"
      >
        <h3 class="text-lg font-semibold text-gray-900">
          {{ competition.name }}
        </h3>
        <CompetitionStatus :competition="competition" />
      </div>
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
        class="flex items-center justify-between md:-my-2"
      >
        <div class="flex gap-2">
          <a
            :href="competition.announcement_link"
            target="_blank"
            class="inline-flex items-center rounded-full bg-indigo-50 px-4 py-1 text-sm font-medium text-indigo-600 transition-colors duration-200 hover:bg-indigo-100"
            @click.stop
          >
            Ausschreibung
            <Icon name="mdi:external-link" class="ml-1 h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>
