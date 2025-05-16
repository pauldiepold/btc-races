<script setup lang="ts">
import { ref } from 'vue'
import { useToastMessages } from '~/composables/useToastMessages'

const { showSuccess, showError } = useToastMessages()

const state = ref({
  ladvUrl: '',
})

const isSubmitting = ref(false)

async function onSubmit() {
  if (!state.value.ladvUrl) {
    showError('Bitte gib eine LADV-URL ein')
    return
  }

  isSubmitting.value = true
  try {
    const data = await $fetch('/api/competitions/ladv', {
      method: 'POST',
      body: {
        ladvUrl: state.value.ladvUrl,
      },
    })

    showSuccess('Der Wettkampf wurde erfolgreich erstellt.')
    setTimeout(() => {
      navigateTo(`/competitions/${data.id}`)
    }, 1500)
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
    back-link="/admin/competitions"
    back-link-text="Zurück zur Übersicht"
    max-width="max-w-2xl"
  >
    <BaseLayer>
      <UForm class="flex flex-col gap-6" @submit="onSubmit">
        <UFormField label="LADV-URL" name="ladvUrl" size="lg" required>
          <UInput
            v-model="state.ladvUrl"
            placeholder="https://ladv.de/ausschreibung/detail/123"
            class="w-full"
          />
        </UFormField>

        <UButton
          type="submit"
          :loading="isSubmitting"
          :disabled="!state.ladvUrl"
          class="w-full"
        >
          Wettkampf erstellen
        </UButton>
      </UForm>
    </BaseLayer>
  </BasePage>
</template>
