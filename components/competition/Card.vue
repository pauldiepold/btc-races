<script setup lang="ts">
import { RegistrationTypeLabelsShort, RaceTypeLabels } from '~/types/enums'
import type { Competition } from '~/types/models.types'

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
        <div class="flex justify-start">
          <CompetitionStatus :competition="competition" />
        </div>
      </div>

      <!-- Beschreibung wenn vorhanden -->
      <p
        v-if="competition.description"
        class="text-muted line-clamp-2 hidden text-sm md:block"
      >
        {{ competition.description }}
      </p>

      <!-- Details -->
      <div class="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
        <!-- Datum -->
        <div v-if="competition.date" class="flex w-20 items-center gap-2">
          <Icon name="lucide:calendar" class="text-muted h-4 w-4" />
          <span>{{
            new Date(competition.date).toLocaleDateString('de-DE')
          }}</span>
        </div>

        <!-- Ort -->
        <div v-if="competition.location" class="flex items-center gap-2">
          <Icon name="lucide:map-pin" class="text-muted h-4 w-4" />
          <span>{{ competition.location }}</span>
        </div>

        <div v-if="competition.race_type" class="flex items-center gap-2">
          <Icon name="mdi:shoe-sneaker" class="text-muted h-4 w-4" />
          <span>{{ RaceTypeLabels[competition.race_type] }}</span>
        </div>

        <div
          v-if="
            competition.championship_type &&
            competition.championship_type !== 'NO_CHAMPIONSHIP'
          "
          class="flex items-center gap-2"
        >
          <Icon name="lucide:medal" class="text-muted h-4 w-4" />
          <span>{{ competition.championship_type }}</span>
        </div>

        <div
          v-if="competition.registration_type"
          class="flex items-center gap-2"
        >
          <Icon name="mdi:register" class="text-muted h-4 w-4" />
          <span>{{
            RegistrationTypeLabelsShort[competition.registration_type]
          }}</span>
        </div>
      </div>
    </BaseLayer>
  </NuxtLink>
</template>
