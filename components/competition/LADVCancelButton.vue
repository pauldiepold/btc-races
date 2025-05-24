<script setup lang="ts">
import { RegistrationsClientRepository } from '~/repositories/registrations.repository'

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

const registrationsRepo = new RegistrationsClientRepository()

const confirmCancel = async () => {
  if (!user.value?.user_metadata?.full_name) {
    error.value = 'Benutzername nicht verfügbar'
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    const result = await registrationsRepo.cancelFromLADV(
      props.registrationId,
      user.value.user_metadata.full_name
    )

    if (result.success) {
      isModalOpen.value = false
      emit('success')
    } else {
      error.value = result.error || 'Fehler bei der LADV-Abmeldung'
    }
  } catch (e: any) {
    error.value = e.message || 'Fehler bei der LADV-Abmeldung'
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
      LADV abmelden
    </UButton>

    <UModal v-model:open="isModalOpen" title="LADV-Abmeldung bestätigen">
      <template #body>
        <p>Wurde {{ name }} in LADV abgemeldet?</p>
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
          <UButton color="error" :loading="isLoading" @click="confirmCancel">
            Ja, {{ name }} wurde in LADV abgemeldet
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
