<script setup lang="ts">
import {
  CHAMPIONSHIP_TYPES,
  RACE_TYPES,
  REGISTRATION_TYPES,
} from '~/types/enums'
import type { Competition } from '~/types/models.types'
const { showSuccess, showError } = useToastMessages()

const state = ref<Partial<Competition>>({
  name: undefined,
  location: undefined,
  registration_deadline: undefined,
  date: undefined,
  announcement_link: undefined,
  description: undefined,
  championship_type: CHAMPIONSHIP_TYPES[0],
  race_type: RACE_TYPES[0],
  registration_type: REGISTRATION_TYPES[0],
})

async function onSubmit(data: Competition) {
  try {
    const { data: response, error } = await $fetch('/api/competitions', {
      method: 'POST',
      body: data,
    })

    if (error || !response?.id) {
      throw new Error(
        error?.message || 'Keine gültige Antwort vom Server erhalten'
      )
    }

    showSuccess('Der Wettkampf wurde erfolgreich erstellt.')

    setTimeout(() => {
      navigateTo(`/competitions/${response.id}`)
    }, 1500)
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Ein unbekannter Fehler ist aufgetreten'
    showError(errorMessage)
  }
}
</script>

<template>
  <BasePage
    heading="Neuen Wettkampf erstellen"
    back-link="/"
    back-link-text="Zurück zur Übersicht"
  >
    <BaseLayer class="max-w-2xl">
      <CompetitionForm v-model="state" @submit="onSubmit" />
    </BaseLayer>
  </BasePage>
</template>
