<script setup lang="ts">
import { useRepositories } from '~/composables/useRepositories'
import type { Competition } from '~/types/models.types'

const props = defineProps<{
  competition: Competition
}>()

const { registrations } = useRepositories()

const { data: competitionRegistrations, pending } = await useLazyAsyncData(
  `registrations-${props.competition.id}`,
  async () => {
    const result = await registrations.findByCompetitionId(props.competition.id)
    return result || []
  }
)

// Registrierungen nach Status gruppieren
const confirmedRegistrations = computed(
  () =>
    competitionRegistrations.value?.filter(
      (reg) =>
        reg.status === 'confirmed' || reg.status === 'pending_cancellation'
    ) || []
)

// Alle ausstehenden Registrierungen (Bestätigungen und Abmeldungen)
const pendingRegistrations = computed(
  () =>
    competitionRegistrations.value?.filter((reg) => reg.status === 'pending') ||
    []
)

const canceledRegistrations = computed(
  () =>
    competitionRegistrations.value?.filter(
      (reg) => reg.status === 'canceled'
    ) || []
)

// State für das Auf- und Zuklappen der abgemeldeten Teilnehmer:innen
const showCanceled = ref(true)
</script>

<template>
  <BaseLayer>
    <h2 class="mb-4 text-xl font-bold">Teilnehmer:innen</h2>

    <template v-if="pending">
      <div class="space-y-4">
        <USkeleton class="h-16 rounded" />
        <USkeleton class="h-16 rounded" />
      </div>
    </template>

    <template v-else>
      <p
        v-if="!competitionRegistrations || competitionRegistrations.length == 0"
      >
        Bisher keine Teilnehmer:innen.
      </p>

      <template v-else>
        <div class="mt-4 space-y-6">
          <!-- Bestätigte Teilnehmer:innen -->
          <div v-if="confirmedRegistrations.length > 0">
            <h3 class="mb-2 font-medium text-green-600">
              Bestätigte Teilnehmer:innen ({{ confirmedRegistrations.length }})
            </h3>
            <div class="space-y-3">
              <CompetitionParticipant
                v-for="registration in confirmedRegistrations"
                :key="registration.id"
                :registration="registration"
                :competition="competition"
              />
            </div>
          </div>

          <!-- Ausstehende Teilnehmer:innen (Bestätigungen und Abmeldungen) -->
          <div v-if="pendingRegistrations.length > 0">
            <h3 class="mb-2 font-medium text-yellow-600">
              Bestätigung ausstehend ({{ pendingRegistrations.length }})
            </h3>
            <div class="space-y-3">
              <CompetitionParticipant
                v-for="registration in pendingRegistrations"
                :key="registration.id"
                :registration="registration"
                :competition="competition"
              />
            </div>
          </div>

          <!-- Abgemeldete Teilnehmer:innen (aufklappbar) -->
          <div v-if="canceledRegistrations.length > 0">
            <div class="cursor-pointer" @click="showCanceled = !showCanceled">
              <h3 class="mb-2 flex items-center font-medium text-red-600">
                <UIcon
                  :name="
                    showCanceled
                      ? 'i-lucide-chevron-down'
                      : 'i-lucide-chevron-right'
                  "
                  class="mr-1 h-4 w-4"
                />
                Abgemeldete Teilnehmer:innen ({{
                  canceledRegistrations.length
                }})
              </h3>
            </div>
            <div v-if="showCanceled" class="space-y-3">
              <CompetitionParticipant
                v-for="registration in canceledRegistrations"
                :key="registration.id"
                :registration="registration"
                :competition="competition"
              />
            </div>
          </div>
        </div>
      </template>
    </template>
  </BaseLayer>
</template>
