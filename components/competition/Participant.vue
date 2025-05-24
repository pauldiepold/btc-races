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
    ladv_canceled_at: string | null
    ladv_registered_at: string | null
    ladv_registered_by: string | null
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
// LADV Status (temporärer lokaler State)
const isLADVRegistered = ref(false)

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

/* const isLADVRegistered = computed(() => {
  if (
    props.registration.ladv_registered_at &&
    !props.registration.ladv_canceled_at
  ) {
    return true
  } else {
    return false
  }
}) */

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
</script>

<template>
  <div class="rounded bg-(--ui-bg) p-3">
    <div class="flex flex-col gap-3">
      <!-- Hauptinformationen -->
      <div class="relative">
        <div class="flex items-center justify-between">
          <p class="text-lg font-medium">{{ registration.member.name }}</p>
        </div>
        <p v-if="registration.notes" class="mt-1 text-sm text-gray-400">
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
          <span class="text-xs text-gray-500">
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
          >
            Abmelden
          </UButton>
          <template #body>
            <p>
              Bist du {{ registration.member.name }} und möchtest Dich selbst
              von diesem Wettkampf abmelden?
            </p>
            <p class="mt-2 text-sm text-gray-600">
              Eine Bestätigungs-E-Mail wird automatisch an Dich versendet.
            </p>

            <div v-if="error" class="mt-3 text-sm text-red-600">
              {{ error }}
            </div>

            <div class="mt-6 flex justify-end gap-3">
              <UButton color="neutral" variant="soft"> Abbrechen </UButton>
              <UButton
                color="error"
                :loading="isLoading"
                @click="cancelRegistration"
              >
                Ja, von diesem Wettkampf abmelden
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
        <span
          class="text-sm font-medium"
          :class="isLADVRegistered ? 'text-green-600' : 'text-yellow-600'"
        >
          {{ isLADVRegistered ? 'LADV gemeldet' : 'LADV nicht gemeldet' }}
        </span>
        <template v-if="user">
          <template v-if="isLADVRegistered">
            <UButton
              size="sm"
              color="neutral"
              variant="soft"
              @click="isLADVRegistered = false"
            >
              LADV abmelden
            </UButton>
          </template>
          <template v-else>
            <UButton
              size="sm"
              color="neutral"
              variant="soft"
              @click="isLADVRegistered = true"
            >
              LADV melden
            </UButton></template
          >
        </template>
      </div>
    </div>
  </div>
</template>
