<script setup lang="ts">
import type { ApiResponse } from '~/types/api.types'

definePageMeta({
  colorMode: 'dark',
})

const route = useRoute()
const token = route.query.token as string

const loading = ref(true)
const error = ref<string | null>(null)
const success = ref(false)

// Automatische Bestätigung beim Laden der Seite
onMounted(async () => {
  if (!token) {
    error.value = 'Kein Token gefunden'
    loading.value = false
    return
  }

  try {
    const response = await $fetch<ApiResponse<{ success: boolean }>>(
      `/api/registrations/confirm?token=${token}`
    )

    if (response.error) {
      switch (response.error.code) {
        case 'MISSING_TOKEN':
          error.value = 'Kein Token gefunden'
          break
        case 'INVALID_TOKEN':
          error.value = 'Ungültiger oder abgelaufener Token'
          break
        case 'INVALID_TOKEN_TYPE':
          error.value = 'Ungültiger Token-Typ'
          break
        case 'INVALID_REGISTRATION':
          error.value = 'Ungültige Registrierung'
          break
        case 'DATABASE_ERROR':
          error.value = 'Fehler bei der Datenbankverarbeitung'
          break
        default:
          error.value = response.error.message
      }
    } else {
      success.value = true
    }
  } catch (e: any) {
    error.value = 'Ein unerwarteter Fehler ist aufgetreten'
    console.error('Fehler bei der Bestätigung:', e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <BasePage heading="" back-link="/" back-link-text="Zurück zur Startseite">
    <div
      class="mx-auto max-w-lg space-y-4 rounded-lg bg-(--ui-bg-accented) p-6 shadow-sm"
    >
      <h2 class="text-center text-2xl font-bold">Anmeldebestätigung</h2>

      <div v-if="loading" class="py-8 text-center">
        <div
          class="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600"
        />
        <p class="mt-4 text-sm text-(--ui-text-dimmed)">
          Bestätigung wird verarbeitet...
        </p>
      </div>

      <div v-else-if="error" class="space-y-4">
        <UAlert
          color="error"
          variant="soft"
          icon="i-lucide-alert-circle"
          :title="error"
        />
        <UButton
          to="/"
          color="primary"
          variant="solid"
          class="w-full justify-center"
        >
          Zurück zur Startseite
        </UButton>
      </div>

      <div v-else-if="success" class="space-y-4">
        <UAlert
          color="success"
          variant="soft"
          icon="i-lucide-check-circle"
          title="Anmeldung erfolgreich bestätigt"
          description="Deine Anmeldung wurde erfolgreich bestätigt. Du wirst nun von unseren Coaches für den Wettkampf angemeldet."
        />
        <UButton to="/" color="primary" class="w-full justify-center">
          Zurück zur Startseite
        </UButton>
      </div>
    </div>
  </BasePage>
</template>
