<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'

const { schema, createFormState } = useCompetitionSchema()

const state = ref<Partial<CompetitionSchema>>(createFormState())

const toast = useToast()

async function onSubmit(event: FormSubmitEvent<CompetitionSchema>) {
  toast.add({
    title: 'Erfolg',
    description: 'Der Wettkampf wurde erfolgreich erstellt.',
    color: 'success',
  })
  console.log(event.data)
  state.value = createFormState()
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
          <UButton type="submit" size="lg">Wettkampf erstellen</UButton>
        </div>
      </UForm>
    </BaseLayer>
  </NuxtLayout>
</template>
