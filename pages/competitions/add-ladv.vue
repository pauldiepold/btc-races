<script setup lang="ts">
import { ref } from 'vue'
import { useToastMessages } from '~/composables/useToastMessages'
import { useLadvUrlSchema } from '~/composables/useLadvUrlSchema'
import type { ApiResponse } from '~/types/api.types'
import type { Competition } from '~/types/models.types'

const { showSuccess, showError } = useToastMessages()
const { schema } = useLadvUrlSchema()

const state = ref({
  url: '',
})

const isSubmitting = ref(false)

async function onSubmit() {
  if (!state.value.url) {
    showError('Bitte gib eine LADV-URL ein')
    return
  }

  isSubmitting.value = true
  try {
    const { data, error, statusCode } = await $fetch<ApiResponse<Competition>>(
      '/api/competitions/ladv',
      {
        method: 'POST',
        body: {
          ladvUrl: state.value.url,
        },
      }
    )

    if (error && statusCode === 409) {
      const existingCompetitionId = error.details
      if (existingCompetitionId) {
        showSuccess('Dieser Wettkampf wurde bereits erstellt.')

        setTimeout(() => {
          navigateTo(`/competitions/${existingCompetitionId}`)
        }, 500)
        return
      }
      showError('Ein Wettkampf mit dieser LADV-ID existiert bereits')
      return
    }

    if (error) throw new Error(error.message)

    showSuccess('Der Wettkampf wurde erfolgreich erstellt.')
    if (data) {
      setTimeout(() => {
        navigateTo(`/competitions/${data.id}`)
      }, 500)
    }
  } catch (error: any) {
    showError(error.message || 'Ein unbekannter Fehler ist aufgetreten')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <BasePage
    heading="LADV-Wettkampf hinzufügen"
    back-link="/"
    back-link-text="Zurück zur Übersicht"
    max-width="max-w-2xl"
  >
    <BaseLayer>
      <UForm
        :schema="schema"
        :state="state"
        class="flex flex-col gap-2"
        @submit="onSubmit"
      >
        <UFormField label="LADV-Link:" name="url" size="lg" required>
          <UInput
            v-model="state.url"
            class="w-full"
            placeholder="Link eingeben..."
          />
        </UFormField>

        <p class="text-muted mb-4 text-sm">
          bspw: https://ladv.de/ausschreibung/detail/42008/...
        </p>

        <div>
          <UButton type="submit" :loading="isSubmitting" :disabled="!state.url">
            Wettkampf hinzufügen
          </UButton>
        </div>
      </UForm>
    </BaseLayer>
  </BasePage>
</template>
