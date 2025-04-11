<script setup lang="ts">
import type { Database } from '~/types/supabase'

type Competition = Database['public']['Tables']['competitions']['Row']

defineProps<{
  competition: Competition
}>()
</script>

<template>
  <div class="bg-white rounded-lg shadow-md overflow-hidden">
    <div class="p-6">
      <div class="flex justify-between items-start">
        <div>
          <h3 class="text-lg font-semibold text-gray-900">
            {{ competition.name }}
          </h3>
          <p class="mt-1 text-sm text-gray-500">
            {{ new Date(competition.date).toLocaleDateString('de-DE') }} in {{ competition.location }}
          </p>
        </div>
        <span
          v-if="competition.is_archived"
          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
        >
          Archiviert
        </span>
      </div>

      <p class="mt-2 text-sm text-gray-600">
        {{ competition.description }}
      </p>

      <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span class="text-gray-500">Anmeldeschluss:</span>
          <span class="ml-2 text-gray-900">
            {{ new Date(competition.registration_deadline).toLocaleDateString('de-DE') }}
          </span>
        </div>
      </div>

      <div v-if="competition.announcement_link" class="mt-4">
        <a
          :href="competition.announcement_link"
          target="_blank"
          class="text-sm text-indigo-600 hover:text-indigo-500"
        >
          Ausschreibung ansehen →
        </a>
      </div>
    </div>
  </div>
</template>
