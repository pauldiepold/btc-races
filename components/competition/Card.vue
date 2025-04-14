<script setup lang="ts">
import type { Database } from '~/types/database.types'

type Competition = Database['public']['Tables']['competitions']['Row']

defineProps<{ competition: Competition }>()
</script>

<template>
  <NuxtLink
    :to="`/competitions/${competition.id}`"
    class="block transition-all duration-300 hover:shadow-lg"
  >
    <BaseLayer class="flex flex-col gap-3 py-4">
      <!-- Header mit Name und Status -->
      <div
        class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
      >
        <h3 class="line-clamp-1 text-lg font-semibold">
          {{ competition.name }}
        </h3>
        <CompetitionStatus :competition="competition" />
      </div>

      <!-- Beschreibung wenn vorhanden -->
      <p
        v-if="competition.description"
        class="text-muted line-clamp-2 hidden text-sm md:block"
      >
        {{ competition.description }}
      </p>

      <!-- Details -->
      <div class="flex flex-wrap items-center gap-4 text-sm">
        <!-- Datum -->
        <div v-if="competition.date" class="flex w-20 items-center gap-2">
          <Icon name="lucide:calendar" class="h-4 w-4 text-gray-500" />
          <span>{{
            new Date(competition.date).toLocaleDateString('de-DE')
          }}</span>
        </div>

        <!-- Ort -->
        <div v-if="competition.location" class="flex items-center gap-2">
          <Icon name="lucide:map-pin" class="h-4 w-4 text-gray-500" />
          <span>{{ competition.location }}</span>
        </div>
      </div>
    </BaseLayer>
  </NuxtLink>
</template>
