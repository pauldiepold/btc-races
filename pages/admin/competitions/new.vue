<script setup lang="ts">
import type { Database } from '~/types/supabase'
import { useSupabaseClient } from '#imports'
import { ref } from 'vue'

const supabase = useSupabaseClient<Database>()

interface CompetitionForm {
  name: string
  date: string
  location: string
  registration_deadline: string
  announcement_link: string
  description: string
  max_participants: number | null
  categories: string
  is_archived: boolean
}

const form = ref<CompetitionForm>({
  name: '',
  date: '',
  location: '',
  registration_deadline: '',
  announcement_link: '',
  description: '',
  max_participants: null,
  categories: '',
  is_archived: false,
})

const errorMessage = ref('')
const successMessage = ref('')

async function handleSubmit() {
  try {
    const { error } = await supabase
      .from('competitions')
      .insert({
        name: form.value.name,
        date: form.value.date,
        location: form.value.location,
        registration_deadline: form.value.registration_deadline,
        announcement_link: form.value.announcement_link,
        description: form.value.description,
        max_participants: form.value.max_participants,
        categories: form.value.categories,
        is_archived: false,
      })

    if (error)
      throw error

    successMessage.value = 'Veranstaltung erfolgreich erstellt!'
    errorMessage.value = ''

    // Kurze Verzögerung vor der Weiterleitung
    setTimeout(async () => {
      await navigateTo('/competitions')
    }, 1500)
  }
  catch (error) {
    console.error('Fehler beim Erstellen der Veranstaltung:', error)
    errorMessage.value = 'Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.'
    successMessage.value = ''
  }
}
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold mb-6">
      Neue Veranstaltung erstellen
    </h1>

    <div v-if="errorMessage" class="mb-4 p-4 bg-red-100 text-red-700 rounded">
      {{ errorMessage }}
    </div>

    <div v-if="successMessage" class="mb-4 p-4 bg-green-100 text-green-700 rounded">
      {{ successMessage }}
    </div>

    <form class="space-y-6" @submit.prevent="handleSubmit">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BaseInput
          v-model="form.name"
          label="Name der Veranstaltung"
          required
        />

        <BaseInput
          v-model="form.date"
          label="Datum"
          type="date"
          required
        />

        <BaseInput
          v-model="form.location"
          label="Ort"
          required
        />

        <BaseInput
          v-model="form.registration_deadline"
          label="Anmeldeschluss"
          type="date"
          required
        />

        <BaseInput
          v-model="form.announcement_link"
          label="Link zur Ausschreibung"
          type="url"
          required
        />

        <BaseInput
          v-model="form.max_participants"
          label="Maximale Teilnehmerzahl"
          type="number"
        />

        <div class="md:col-span-2">
          <BaseTextarea
            v-model="form.description"
            label="Beschreibung"
          />
        </div>

        <div class="md:col-span-2">
          <BaseInput
            v-model="form.categories"
            label="Kategorien"
            placeholder="Kategorie1, Kategorie2, ..."
          />
        </div>
      </div>

      <div class="flex justify-end">
        <BaseButton
          type="submit"
        >
          Veranstaltung erstellen
        </BaseButton>
      </div>
    </form>
  </div>
</template>
