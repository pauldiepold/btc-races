<script setup lang="ts">
import {
  RegistrationStatusLabels,
  RegistrationStatuses,
  RegistrationTypes,
  type RegistrationStatus,
} from '~/types/enums'
import type { Competition } from '~/types/models.types'

const props = defineProps<{
  registration: {
    id: string
    ladv_registered_at: string | null
    ladv_registered_by: string | null
    ladv_canceled_at: string | null
    ladv_canceled_by: string | null
    member: {
      name: string
    }
    status: RegistrationStatus
    created_at: string
    notes?: string
  }
  competition: Competition
}>()

const user = useSupabaseUser()

// LADV Status basierend auf Datenbank-Feldern
const isLADVRegistered = computed(() => {
  return (
    props.registration.ladv_registered_at &&
    !props.registration.ladv_canceled_at
  )
})

// Warnung für LADV-Abmeldung durch Coaches nötig
const needsLADVCancellationByCoach = computed(() => {
  return (
    isLADVRegistered.value &&
    props.registration.status === RegistrationStatuses.CANCELED
  )
})

// Warnung für LADV-Anmeldung nötig
const needsLADVRegistrationByCoach = computed(() => {
  return (
    !isLADVRegistered.value &&
    (props.registration.status === RegistrationStatuses.CONFIRMED ||
      props.registration.status === RegistrationStatuses.PENDING_CANCELLATION)
  )
})

function getStatusColor(status: RegistrationStatus) {
  switch (status) {
    case RegistrationStatuses.CONFIRMED:
      return 'text-green-600'
    case RegistrationStatuses.PENDING:
      return 'text-yellow-600'
    case RegistrationStatuses.CANCELED:
      return 'text-muted'
    case RegistrationStatuses.PENDING_CANCELLATION:
      return 'text-yellow-600'
    default:
      return ''
  }
}

// Abmeldung-Funktionalität
const isLoading = ref(false)
const error = ref('')
const isModalOpen = ref(false)
const successMessage = ref('')

const cancelRegistration = async () => {
  isLoading.value = true
  error.value = ''

  try {
    const response = await $fetch(
      `/api/registration/${props.registration.id}/cancel`,
      {
        method: 'POST',
      }
    )

    // Seite aktualisieren nach erfolgreicher Abmeldung
    if (response?.data?.success) {
      // Modal schließen
      isModalOpen.value = false
      // Erfolgsmeldung anzeigen
      if (response?.data?.message) {
        successMessage.value = response.data.message
      }
      // Seite aktualisieren
      await refreshNuxtData(`registrations-${useRoute().params.id}`)
    } else {
      error.value = response?.error?.message || 'Fehler bei der Abmeldung'
    }
  } catch (e: any) {
    error.value = e.message || 'Fehler bei der Abmeldung'
  } finally {
    isLoading.value = false
  }
}

// LADV-Aktionen erfolgreich
const handleLADVSuccess = async () => {
  // Daten neu laden
  await refreshNuxtData(`registrations-${useRoute().params.id}`)
}
</script>

<template>
  <div class="rounded bg-(--ui-bg) p-3">
    <div class="flex flex-col gap-3">
      <!-- Hauptinformationen -->
      <div class="relative">
        <div class="flex items-center justify-between">
          <p class="text-lg font-medium">{{ registration.member.name }}</p>
        </div>
        <p v-if="registration.notes" class="text-muted mt-1 text-sm">
          {{ registration.notes }}
        </p>
      </div>

      <!-- Status und Aktionen -->
      <div
        class="flex items-center justify-between border-t border-gray-600 pt-3"
      >
        <div class="flex items-center gap-2">
          <span
            class="text-sm font-medium"
            :class="getStatusColor(registration.status)"
          >
            {{ RegistrationStatusLabels[registration.status] }}
          </span>
          <span class="text-muted text-xs">
            ({{
              new Date(registration.created_at).toLocaleDateString('de-DE')
            }})
          </span>
        </div>

        <UModal v-model:open="isModalOpen" title="Abmeldung bestätigen">
          <UButton
            v-if="registration.status === 'confirmed'"
            color="error"
            variant="soft"
            size="sm"
            @click="isModalOpen = true"
          >
            Abmelden
          </UButton>
          <template #body>
            <p>
              Bist du {{ registration.member.name }} und möchtest Dich selbst
              von diesem Wettkampf abmelden?
            </p>
            <p class="text-dimmed mt-2 text-sm">
              Du bekommst eine E-Mail mit einem Link zugesendet, über den du
              deine Abmeldung bestätigen musst.
            </p>

            <div v-if="error" class="mt-3 text-sm text-red-600">
              {{ error }}
            </div>

            <div class="mt-6 flex justify-end gap-3">
              <UButton
                color="neutral"
                variant="soft"
                @click="isModalOpen = false"
              >
                Abbrechen
              </UButton>
              <UButton
                color="error"
                :loading="isLoading"
                @click="cancelRegistration"
              >
                Ja, ich möchte mich abmelden
              </UButton>
            </div>
          </template>
        </UModal>
      </div>

      <!-- LADV Meldung -->
      <div
        v-if="
          competition.registration_type === RegistrationTypes.LADV &&
          registration.status !== RegistrationStatuses.PENDING
        "
        class="flex items-center justify-between border-t border-gray-600 pt-3"
      >
        <p class="text-sm">
          <span
            :class="isLADVRegistered ? 'text-green-600' : 'text-yellow-600'"
          >
            {{
              isLADVRegistered
                ? 'LADV gemeldet'
                : registration.ladv_canceled_at
                  ? 'LADV abgemeldet'
                  : 'LADV nicht gemeldet'
            }}
          </span>

          <span class="text-muted text-xs">
            <template v-if="isLADVRegistered">
              ({{ registration.ladv_registered_by }} -
              {{ formatDateShort(registration.ladv_registered_at) }})
            </template>
            <template
              v-else-if="!isLADVRegistered && registration.ladv_canceled_at"
            >
              ({{ registration.ladv_canceled_by }} -
              {{ formatDateShort(registration.ladv_canceled_at) }})
            </template>
          </span>
        </p>

        <div class="flex items-center gap-4">
          <!-- Warnung für LADV-Abmeldung durch Coaches -->
          <div
            v-if="needsLADVCancellationByCoach"
            class="flex items-center gap-1 text-orange-500"
            title="LADV-Abmeldung durch Coaches erforderlich"
          >
            <Icon name="mdi:exclamation-thick" class="h-4 w-4" />
            <span class="text-xs">LADV-Abmeldung nötig</span>
          </div>

          <!-- Warnung für LADV-Anmeldung nötig -->
          <div
            v-if="needsLADVRegistrationByCoach"
            class="flex items-center gap-1 text-orange-500"
            title="LADV-Anmeldung durch Coaches erforderlich"
          >
            <Icon name="mdi:exclamation-thick" class="h-4 w-4" />
            <span class="text-xs">LADV-Meldung nötig</span>
          </div>

          <template v-if="user">
            <CompetitionLADVCancelButton
              v-if="isLADVRegistered"
              :registration-id="registration.id"
              :name="registration.member.name"
              @success="handleLADVSuccess"
            />
            <CompetitionLADVRegisterButton
              v-else
              :registration-id="registration.id"
              :name="registration.member.name"
              @success="handleLADVSuccess"
            />
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
