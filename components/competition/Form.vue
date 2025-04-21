<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Database } from '~/types/database.types'
import {
  championshipTypeItems,
  raceTypeItems,
  registrationTypeItems,
} from '~/types/enums'
import type { Competition } from '~/types/models.types'

const props = defineProps<{
  modelValue: Partial<Competition>
  isEdit?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Partial<Competition>): void
  (e: 'submit', data: Competition): void
}>()

const { schema } = useCompetitionSchema()
const toast = useToast()

const isSubmitting = ref(false)

async function onSubmit(event: FormSubmitEvent<Competition>) {
  isSubmitting.value = true
  try {
    emit('submit', event.data)
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

function updateField<K extends keyof Competition>(
  field: K,
  value: Competition[K]
) {
  emit('update:modelValue', { ...props.modelValue, [field]: value })
}
</script>

<template>
  <UForm
    :schema="schema"
    :state="modelValue"
    class="space-y-6"
    @submit="onSubmit"
    @error="onError"
  >
    <UFormField label="Name des Wettkampfes" size="lg" name="name" required>
      <UInput
        :value="modelValue.name"
        class="w-full"
        @input="
          (e: Event) =>
            updateField('name', (e.target as HTMLInputElement).value)
        "
      />
    </UFormField>

    <UFormField label="Ort" name="location" size="lg">
      <UInput
        :value="modelValue.location"
        class="w-full"
        trailing-icon="lucide:map-pin"
        @input="
          (e: Event) =>
            updateField('location', (e.target as HTMLInputElement).value)
        "
      />
    </UFormField>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div class="flex flex-col gap-4">
        <UFormField label="Wettkampftyp" name="race_type" size="lg" required>
          <URadioGroup
            :default-value="modelValue.race_type"
            :items="raceTypeItems"
            :ui="{
              fieldset: 'gap-2',
            }"
            @update:model-value="
              (v: string) =>
                updateField(
                  'race_type',
                  v as Database['public']['Enums']['race_type']
                )
            "
          />
        </UFormField>
        <UFormField
          name="registration_type"
          label="Anmeldung"
          size="lg"
          required
        >
          <URadioGroup
            :default-value="modelValue.registration_type"
            :items="registrationTypeItems"
            :ui="{
              fieldset: 'gap-2',
            }"
            @update:model-value="
              (v: string) =>
                updateField(
                  'registration_type',
                  v as Database['public']['Enums']['registration_type']
                )
            "
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
          :default-value="modelValue.championship_type"
          :items="championshipTypeItems"
          :ui="{
            fieldset: 'gap-2',
          }"
          @update:model-value="
            (v: string) =>
              updateField(
                'championship_type',
                v as Database['public']['Enums']['championship_type']
              )
          "
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
          :value="modelValue.registration_deadline"
          type="date"
          class="w-full"
          @input="
            (e: Event) =>
              updateField(
                'registration_deadline',
                (e.target as HTMLInputElement).value
              )
          "
        />
      </UFormField>

      <UFormField label="Veranstaltungsdatum" name="date" size="lg" required>
        <UInput
          :value="modelValue.date"
          type="date"
          class="w-full"
          @input="
            (e: Event) =>
              updateField('date', (e.target as HTMLInputElement).value)
          "
        />
      </UFormField>
    </div>
    <UFormField
      label="Link zur Ausschreibung"
      size="lg"
      name="announcement_link"
    >
      <UInput
        :value="modelValue.announcement_link"
        type="url"
        class="w-full"
        trailing-icon="lucide:external-link"
        @input="
          (e: Event) =>
            updateField(
              'announcement_link',
              (e.target as HTMLInputElement).value
            )
        "
      />
    </UFormField>

    <UFormField label="Beschreibung" name="description" size="lg">
      <UTextarea
        :value="modelValue.description"
        type="text"
        class="w-full"
        @input="
          (e: Event) =>
            updateField('description', (e.target as HTMLTextAreaElement).value)
        "
      />
    </UFormField>

    <div class="flex justify-end">
      <UButton
        type="submit"
        size="lg"
        :loading="isSubmitting"
        :disabled="isSubmitting"
      >
        {{ isEdit ? 'Wettkampf aktualisieren' : 'Wettkampf erstellen' }}
      </UButton>
    </div>
  </UForm>
</template>
