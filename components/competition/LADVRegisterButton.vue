<script setup lang="ts">
import type { ApiResponse } from '~/types/api.types'

const props = defineProps<{
  registrationId: string | number
  name: string
}>()

const emit = defineEmits<{
  success: []
}>()

const user = useSupabaseUser()
const isModalOpen = ref(false)
const isLoading = ref(false)
const error = ref('')

const confirmRegister = async () => {
  if (!user.value?.user_metadata?.full_name) {
    error.value = 'Benutzername nicht verfügbar'
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    const response = await $fetch<
      ApiResponse<{
        success: boolean
        registrationId: number
        coachName: string
      }>
    >('/api/registrations/ladv-register', {
      method: 'POST',
      body: {
        registrationId: props.registrationId,
      },
    })

    if (response.error) {
      error.value = response.error.message || 'Fehler bei der LADV-Anmeldung'
    } else if (response.data?.success) {
      isModalOpen.value = false
      emit('success')
    } else {
      error.value = 'Unerwartete Antwort vom Server'
    }
  } catch (e: any) {
    error.value = e.message || 'Fehler bei der LADV-Anmeldung'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div>
    <UButton
      size="sm"
      color="neutral"
      variant="soft"
      @click="isModalOpen = true"
    >
      LADV melden
    </UButton>

    <UModal v-model:open="isModalOpen" title="LADV-Anmeldung bestätigen">
      <template #body>
        <p>Wurde {{ name }} in LADV gemeldet?</p>
        <p class="text-muted mt-2 text-sm">
          Sie bekommt eine Bestätigungs-E-Mail zugesendet.
        </p>

        <div v-if="error" class="mt-3 text-sm text-red-600">
          {{ error }}
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <UButton color="neutral" variant="soft" @click="isModalOpen = false">
            Abbrechen
          </UButton>
          <UButton
            color="primary"
            :loading="isLoading"
            @click="confirmRegister"
          >
            Ja, {{ name }} wurde in LADV gemeldet
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
