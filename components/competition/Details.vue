<script setup lang="ts">
import type { Competition } from '~/types/models.types'
import {
  RegistrationTypeLabels,
  RaceTypeLabels,
  ChampionshipTypeLabels,
  ChampionshipTypes,
} from '~/types/enums'

defineProps<{
  competition: Competition
}>()
</script>

<template>
  <BaseLayer>
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
      <UFormField v-if="competition.location" label="Ort" size="xl">
        <UInput
          :model-value="competition.location"
          icon="i-lucide-map-pin"
          class="w-full !cursor-pointer"
          disabled
        />
      </UFormField>

      <UFormField v-if="competition.sportstaette" label="Sportstätte" size="xl">
        <UInput
          :model-value="competition.sportstaette"
          icon="i-lucide-map-pin"
          class="w-full !cursor-pointer"
          disabled
        />
      </UFormField>

      <div class="col-start-1 grid grid-cols-2 gap-4">
        <UFormField label="Meldefrist" size="xl" class="w-full !cursor-pointer">
          <UInput
            :model-value="
              new Date(competition.registration_deadline).toLocaleDateString(
                'de-DE'
              )
            "
            icon="i-lucide-clock"
            class="w-full !cursor-pointer"
            disabled
          />
        </UFormField>

        <UFormField label="Datum" size="xl">
          <UInput
            :model-value="
              new Date(competition.date).toLocaleDateString('de-DE')
            "
            icon="i-lucide-calendar"
            class="w-full !cursor-pointer"
            disabled
          />
        </UFormField>
      </div>

      <UFormField
        v-if="competition.veranstalter"
        class="col-start-1"
        label="Veranstalter"
        size="xl"
      >
        <UInput
          :model-value="competition.veranstalter"
          class="w-full !cursor-pointer"
          disabled
        />
      </UFormField>

      <UFormField
        v-if="
          competition.ausrichter &&
          competition.ausrichter !== competition.veranstalter
        "
        label="Ausrichter"
        size="xl"
      >
        <UInput
          :model-value="competition.ausrichter"
          class="w-full !cursor-pointer"
          disabled
        />
      </UFormField>

      <UFormField v-if="false" label="Anmeldung" size="xl">
        <UInput
          :model-value="RegistrationTypeLabels[competition.registration_type]"
          icon="i-lucide-tag"
          class="w-full !cursor-pointer"
          disabled
        />
      </UFormField>

      <UFormField label="Rennart" size="xl" class="col-start-1">
        <UInput
          :model-value="RaceTypeLabels[competition.race_type]"
          icon="i-lucide-ruler"
          class="w-full !cursor-pointer"
          disabled
        />
      </UFormField>

      <UFormField
        v-if="
          competition.championship_type !== ChampionshipTypes.NO_CHAMPIONSHIP
        "
        label="Meisterschaft"
        size="xl"
      >
        <UInput
          :model-value="ChampionshipTypeLabels[competition.championship_type]"
          icon="i-lucide-clock"
          class="w-full !cursor-pointer"
          disabled
        />
      </UFormField>
    </div>
  </BaseLayer>
</template>
