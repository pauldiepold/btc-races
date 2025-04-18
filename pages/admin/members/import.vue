<script setup lang="ts">
import type { ApiResponse } from '~/types/api.types'

definePageMeta({
  colorMode: 'dark',
})

const file = ref<File | null>(null)
const isLoading = ref(false)
const warnings = ref<string[]>([])
const success = ref(false)
const imported = ref(0)

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files?.length) {
    file.value = input.files[0]
  }
}

const handleSubmit = async () => {
  if (!file.value) return

  isLoading.value = true
  warnings.value = []
  success.value = false

  try {
    const formData = new FormData()
    formData.append('file', file.value)

    const response = await $fetch<ApiResponse<void>>('/api/import/members', {
      method: 'POST',
      body: formData,
    })

    if (response.success) {
      success.value = true
      if (response.imported) {
        imported.value = response.imported
      }
      if (response.skipped?.length) {
        warnings.value = response.skipped
      }
      if (response.warnings?.length) {
        warnings.value = [...warnings.value, ...response.warnings]
      }
    } else if (response.error) {
      warnings.value = [response.error.message]
    }
  } catch (error) {
    warnings.value = [
      'Fehler beim Import: ' +
        (error instanceof Error ? error.message : 'Unbekannter Fehler'),
    ]
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <BasePage
    heading="Mitglieder importieren"
    back-link="/admin"
    back-link-text="Zurück zum Admin-Dashboard"
  >
    <BaseLayer>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <UFormField label="Excel-Datei" required>
          <UInput
            type="file"
            accept=".xlsx,.xls"
            :disabled="isLoading"
            variant="outline"
            class="w-full"
            @change="handleFileChange"
          />
        </UFormField>

        <div v-if="warnings.length > 0" class="text-yellow-600">
          <h3 class="font-bold">Warnungen:</h3>
          <ul class="list-disc pl-4">
            <li v-for="warning in warnings" :key="warning">{{ warning }}</li>
          </ul>
        </div>

        <div v-if="success" class="text-green-500">
          <p>
            Import erfolgreich! {{ imported }} Mitglieder wurden importiert.
          </p>
        </div>

        <UButton
          type="submit"
          color="primary"
          :loading="isLoading"
          :disabled="!file"
        >
          Importieren
        </UButton>
      </form>
    </BaseLayer>
  </BasePage>
</template>
