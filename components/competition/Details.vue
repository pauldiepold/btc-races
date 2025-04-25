<script setup lang="ts">
import type { Competition } from '~/types/models.types'
import {
  RegistrationTypeLabels,
  RaceTypeLabels,
  ChampionshipTypeLabels,
} from '~/types/enums'

defineProps<{
  competition: Competition
}>()
</script>

<template>
  <BaseLayer>
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
      <UFormField label="Status" size="lg">
        <CompetitionStatus class="mt-2" :competition="competition" />
      </UFormField>

      <UFormField label="Ort" size="lg">
        <UInput
          :model-value="competition.location"
          icon="lucide:map-pin"
          class="w-full !cursor-pointer"
          disabled
        />
      </UFormField>

      <UFormField label="Meldefrist" size="lg" class="w-full !cursor-pointer">
        <UInput
          :model-value="
            new Date(competition.registration_deadline).toLocaleDateString(
              'de-DE'
            )
          "
          icon="lucide:clock"
          class="w-full !cursor-pointer"
          disabled
        />
      </UFormField>

      <UFormField label="Datum" size="lg">
        <UInput
          :model-value="new Date(competition.date).toLocaleDateString('de-DE')"
          icon="lucide:calendar"
          class="w-full !cursor-pointer"
          disabled
        />
      </UFormField>

      <UFormField label="Anmeldung" size="lg">
        <UInput
          :model-value="RegistrationTypeLabels[competition.registration_type]"
          icon="lucide:tag"
          class="w-full !cursor-pointer"
          disabled
        />
      </UFormField>

      <UFormField label="Rennart" size="lg">
        <UInput
          :model-value="RaceTypeLabels[competition.race_type]"
          icon="lucide:ruler"
          class="w-full !cursor-pointer"
          disabled
        />
      </UFormField>

      <UFormField label="Meisterschaft" size="lg">
        <UInput
          :model-value="ChampionshipTypeLabels[competition.championship_type]"
          icon="lucide:clock"
          class="w-full !cursor-pointer"
          disabled
        />
      </UFormField>
    </div>
  </BaseLayer>
</template>
