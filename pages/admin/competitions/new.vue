<script setup lang="ts">
import type { ApiResponse } from '~/types/api'
import type { Database } from '~/types/database.types'
import { ref } from 'vue'

interface ValidationError {
  field: string
  message: string
}

interface ApiErrorResponse {
  message: string
  details?: ValidationError[]
}

type CompetitionApiResponse = Omit<
  ApiResponse<Database['public']['Tables']['competitions']['Row']>,
  'error'
> & {
  error: ApiErrorResponse | null
}

interface CompetitionForm {
  name: string
  date: string
  location: string
  registration_deadline: string
  announcement_link: string
  description: string
  is_archived: boolean
}

const form = ref<CompetitionForm>({
  name: '',
  date: '',
  location: '',
  registration_deadline: '',
  announcement_link: '',
  description: '',
  is_archived: false,
})

const errorMessage = ref('')
const validationErrors = ref<Record<string, string>>({})
const successMessage = ref('')

async function handleSubmit() {
  try {
    validationErrors.value = {}
    const response = await $fetch<CompetitionApiResponse>('/api/competitions', {
      method: 'POST',
      body: {
        name: form.value.name,
        date: form.value.date,
        location: form.value.location,
        registration_deadline: form.value.registration_deadline,
        announcement_link: form.value.announcement_link,
        description: form.value.description,
      },
    })

    if (response.error) {
      if (response.error.details) {
        response.error.details.forEach((detail) => {
          if (!validationErrors.value[detail.field]) {
            validationErrors.value[detail.field] = detail.message
          }
        })
        throw new Error('Bitte korrigieren Sie die markierten Felder')
      }
      throw new Error(response.error.message)
    }

    successMessage.value = 'Wettkampf erfolgreich erstellt!'
    errorMessage.value = ''

    // Kurze Verzögerung vor der Weiterleitung
    setTimeout(async () => {
      await navigateTo('/competitions')
    }, 1500)
  } catch (error: any) {
    console.error('Fehler beim Erstellen der Wettkampf:', error)
    errorMessage.value =
      error.message ||
      'Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.'
    successMessage.value = ''
  }
}
</script>

<template>
  <div class="container mx-auto max-w-xl px-4 py-8">
    <h1 class="mb-6 text-2xl font-bold">Neuen Wettkampf erstellen</h1>

    <div v-if="errorMessage" class="mb-4 rounded bg-red-100 p-4 text-red-700">
      {{ errorMessage }}
    </div>

    <div
      v-if="successMessage"
      class="mb-4 rounded bg-green-100 p-4 text-green-700"
    >
      {{ successMessage }}
    </div>

    <form class="mx-auto space-y-6" @submit.prevent="handleSubmit">
      <div class="flex flex-col gap-6">
        <BaseInput
          v-model="form.name"
          label="Name des Wettkampfes"
          required
          :error="validationErrors.name"
        />

        <BaseInput
          v-model="form.location"
          label="Ort"
          :error="validationErrors.location"
        />

        <BaseInput
          v-model="form.registration_deadline"
          label="Meldeschluss"
          type="date"
          required
          :error="validationErrors.registration_deadline"
        />

        <BaseInput
          v-model="form.date"
          label="Veranstaltungsdatum"
          type="date"
          required
          :error="validationErrors.date"
        />

        <BaseInput
          v-model="form.announcement_link"
          label="Link zur Ausschreibung"
          type="url"
          :error="validationErrors.announcement_link"
        />

        <div class="md:col-span-2">
          <BaseTextarea
            v-model="form.description"
            label="Beschreibung"
            :error="validationErrors.description"
          />
        </div>
      </div>

      <div class="flex justify-end">
        <BaseButton type="submit">Wettkampf erstellen</BaseButton>
      </div>
    </form>
  </div>
</template>
