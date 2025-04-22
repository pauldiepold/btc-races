<script setup lang="ts">
import {
  RegistrationStatusLabels,
  type RegistrationStatus,
} from '~/types/enums'

const props = defineProps<{
  registration: {
    id: string
    member: {
      name: string
    }
    status: RegistrationStatus
    created_at: string
    notes?: string
  }
}>()

const statusColor = computed(() => {
  switch (props.registration.status) {
    case 'confirmed':
      return 'text-green-600'
    case 'pending':
      return 'text-yellow-600'
    case 'canceled':
      return 'text-red-600'
    case 'pending_cancellation':
      return 'text-yellow-600'
    default:
      return ''
  }
})

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
    <div class="grid grid-cols-2 gap-4">
      <div>
        <p class="font-medium">{{ registration.member.name }}</p>
        <p class="text-sm" :class="statusColor">
          {{ RegistrationStatusLabels[registration.status] }}
        </p>
      </div>
      <div class="text-right">
        <div class="flex items-center justify-end gap-2 text-sm text-gray-500">
          <span>{{
            new Date(registration.created_at).toLocaleDateString('de-DE')
          }}</span>
          <UIcon name="lucide:calendar" class="h-4 w-4" />
        </div>

        <!-- Abmelden-Button nur für bestätigte Teilnehmer anzeigen -->

        <!-- Modal zur Bestätigung der Abmeldung -->
        <UModal v-model:open="isModalOpen" title="Teilnahme abmelden">
          <UButton
            v-if="registration.status === 'confirmed'"
            color="error"
            variant="soft"
            size="xs"
            class="mt-2"
          >
            Abmelden
          </UButton>
          <template #body>
            <div class="p-4">
              <p>
                Möchtest du {{ registration.member.name }} wirklich von diesem
                Wettkampf abmelden?
              </p>
              <p class="mt-2 text-sm text-gray-600">
                Eine Bestätigungs-E-Mail wird automatisch versendet.
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
                  Abmelden bestätigen
                </UButton>
              </div>
            </div>
          </template>
        </UModal>
      </div>
    </div>
    <p v-if="registration.notes" class="mt-2 text-sm text-gray-600">
      {{ registration.notes }}
    </p>
  </div>
</template>
