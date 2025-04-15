<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { ApiResponse } from '~/types/api'
import type { Database } from '~/types/database.types'

definePageMeta({
  colorMode: 'dark',
})

const { schema, createFormState } = useCompetitionSchema()
const toast = useToast()

const state = ref<Partial<CompetitionSchema>>(createFormState())
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

        <UFormField label="Veranstaltungsdatum" name="date" size="lg" required>
          <UInput v-model="state.date" type="date" class="w-full" />
        </UFormField>

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
