<script setup lang="ts">
import { useRepositories } from '~/composables/useRepositories'

const props = defineProps<{
  competitionId: string
}>()

const { registrations } = useRepositories()

const { data: competitionRegistrations } = await useAsyncData(
  `registrations-${props.competitionId}`,
  async () => {
    const result = await registrations.findByCompetitionId(props.competitionId)
    return result || []
  }
)

// Registrierungen nach Status gruppieren
const confirmedRegistrations = computed(
  () =>
    competitionRegistrations.value?.filter(
      (reg) => reg.status === 'confirmed'
    ) || []
)

// Alle ausstehenden Registrierungen (Bestätigungen und Abmeldungen)
const pendingRegistrations = computed(
  () =>
    competitionRegistrations.value?.filter(
      (reg) => reg.status === 'pending' || reg.status === 'pending_cancellation'
    ) || []
)

const canceledRegistrations = computed(
  () =>
    competitionRegistrations.value?.filter(
      (reg) => reg.status === 'canceled'
    ) || []
)

// State für das Auf- und Zuklappen der abgemeldeten Teilnehmer:innen
const showCanceled = ref(false)
</script>

<template>
  <BaseLayer>
    <h2 class="mb-4 text-xl font-bold">Teilnehmer:innen</h2>

    <p v-if="!competitionRegistrations || competitionRegistrations.length == 0">
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
            />
          </div>
        </div>

        <!-- Ausstehende Teilnehmer:innen (Bestätigungen und Abmeldungen) -->
        <div v-if="pendingRegistrations.length > 0">
          <h3 class="mb-2 font-medium text-yellow-600">
            Ausstehend ({{ pendingRegistrations.length }})
          </h3>
          <div class="space-y-3">
            <CompetitionParticipant
              v-for="registration in pendingRegistrations"
              :key="registration.id"
              :registration="registration"
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
              Abgemeldete Teilnehmer:innen ({{ canceledRegistrations.length }})
            </h3>
          </div>
          <div v-if="showCanceled" class="space-y-3">
            <CompetitionParticipant
              v-for="registration in canceledRegistrations"
              :key="registration.id"
              :registration="registration"
            />
          </div>
        </div>
      </div>
    </template>
  </BaseLayer>
</template>
