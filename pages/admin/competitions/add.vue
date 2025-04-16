<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { ApiResponse } from '~/types/api'
import type { Database } from '~/types/database.types'
import {
  championshipTypeOptions,
  raceTypeOptions,
  registrationTypeOptions,
  CHAMPIONSHIP_TYPES,
  RACE_TYPES,
  REGISTRATION_TYPES,
} from '~/types/enums'

definePageMeta({
  colorMode: 'dark',
})

const { schema } = useCompetitionSchema()
const toast = useToast()

const state = ref<Partial<CompetitionSchema>>({
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

const isSubmitting = ref(false)

async function onSubmit(event: FormSubmitEvent<CompetitionSchema>) {
  isSubmitting.value = true
  try {
    const { data, error } = await $fetch<
      ApiResponse<Database['public']['Tables']['competitions']['Row']>
    >('/api/competitions', {
      method: 'POST',
      body: event.data,
    })

    if (error) {
      throw new Error(error.message)
    }

    toast.add({
      title: 'Erfolg',
      description: 'Der Wettkampf wurde erfolgreich erstellt.',
      color: 'success',
    })

    // Weiterleitung zur Detailseite
    setTimeout(async () => {
      await navigateTo(`/competitions/${data?.id}`)
    }, 1500)
  } catch (error: any) {
    toast.add({
      title: 'Fehler',
      description: error.message || 'Ein Fehler ist aufgetreten.',
      color: 'error',
    })
  } finally {
    isSubmitting.value = false
  }
}

async function onError() {
  toast.add({
    title: 'Fehler',
    description: 'Bitte überprüfe deine Eingaben.',
    color: 'error',
  })
}
</script>

<template>
  <NuxtLayout
    name="base"
    heading="Neuen Wettkampf erstellen"
    back-link="/"
    back-link-text="Zurück zur Übersicht"
  >
    <BaseLayer class="max-w-2xl">
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-6"
        @submit="onSubmit"
        @error="onError"
      >
        <UFormField label="Name des Wettkampfes" size="lg" name="name" required>
          <UInput v-model="state.name" class="w-full" />
        </UFormField>

        <UFormField label="Ort" name="location" size="lg">
          <UInput
            v-model="state.location"
            class="w-full"
            trailing-icon="lucide:map-pin"
          />
        </UFormField>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div class="flex flex-col gap-4">
            <UFormField
              label="Wettkampftyp"
              name="race_type"
              size="lg"
              required
            >
              <URadioGroup
                v-model="state.race_type"
                :items="raceTypeOptions"
                :ui="{
                  fieldset: 'gap-2',
                }"
              />
            </UFormField>
            <UFormField
              name="registration_type"
              label="Anmeldung"
              size="lg"
              required
            >
              <URadioGroup
                v-model="state.registration_type"
                :items="registrationTypeOptions"
                :ui="{
                  fieldset: 'gap-2',
                }"
              />
            </UFormField>
          </div>
          <UFormField
            label="Meisterschaft"
            name="championship_type"
            size="lg"
            required
          >
            <URadioGroup
              v-model="state.championship_type"
              :items="championshipTypeOptions"
              :ui="{
                fieldset: 'gap-2',
              }"
            />
          </UFormField>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <UFormField
            label="Meldeschluss"
            name="registration_deadline"
            size="lg"
            required
          >
            <UInput
              v-model="state.registration_deadline"
              type="date"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Veranstaltungsdatum"
            name="date"
            size="lg"
            required
          >
            <UInput v-model="state.date" type="date" class="w-full" />
          </UFormField>
        </div>
        <UFormField
          label="Link zur Ausschreibung"
          size="lg"
          name="announcement_link"
        >
          <UInput
            v-model="state.announcement_link"
            type="url"
            class="w-full"
            trailing-icon="lucide:external-link"
          />
        </UFormField>

        <UFormField label="Beschreibung" name="description" size="lg">
          <UTextarea v-model="state.description" type="text" class="w-full" />
        </UFormField>

        <div class="flex justify-end">
          <UButton
            type="submit"
            size="lg"
            :loading="isSubmitting"
            :disabled="isSubmitting"
          >
            Wettkampf erstellen
          </UButton>
        </div>
      </UForm>
    </BaseLayer>
  </NuxtLayout>
</template>
