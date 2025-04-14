<script setup lang="ts">
import type { Database } from '~/types/database.types'

type Competition = Database['public']['Tables']['competitions']['Row']

defineProps<{ competition: Competition }>()
</script>

<template>
  <NuxtLink
    :to="`/competitions/${competition.id}`"
    class="transition-all duration-300 hover:shadow-lg"
  >
    <BaseLayer class="grid grid-cols-2 gap-4">
      <div
        class="col-span-2 flex flex-col gap-2 md:flex-row md:items-center md:gap-4"
      >
        <h3 class="text-lg font-semibold">
          {{ competition.name }}
        </h3>
        <CompetitionStatus :competition="competition" />
      </div>

      <UButton
        v-if="competition.date"
        icon="lucide:calendar"
        variant="ghost"
        color="neutral"
        disabled
        class="!cursor-pointer"
        :label="new Date(competition.date).toLocaleDateString('de-DE')"
      />

      <UButton
        v-if="competition.registration_deadline"
        icon="lucide:clock"
        variant="ghost"
        color="neutral"
        disabled
        class="!cursor-pointer"
        :label="`Meldefrist: ${new Date(
          competition.registration_deadline
        ).toLocaleDateString('de-DE')}`"
      />

      <UButton
        v-if="competition.location"
        icon="lucide:map-pin"
        variant="ghost"
        color="neutral"
        disabled
        class="!cursor-pointer"
        :label="competition.location"
      />

      <div v-if="competition.announcement_link">
        <UButton
          variant="soft"
          color="neutral"
          target="_blank"
          :to="competition.announcement_link"
          class="w-full justify-center md:w-auto md:justify-start"
          icon="lucide:external-link"
        >
          Ausschreibung
        </UButton>
      </div>
    </BaseLayer>
  </NuxtLink>
</template>
