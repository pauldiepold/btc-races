<script setup lang="ts">
import type { ApiResponse } from '~/types/api.types'
import { useRepositories } from '~/composables/useRepositories'
import { useToastMessages } from '~/composables/useToastMessages'
import type { Competition } from '~/types/models.types'

const route = useRoute()
const { competitions } = useRepositories()
const { showError, showSuccess } = useToastMessages()

const state = ref<Competition>()
const loading = ref(true)
const error = ref<string>()

onMounted(async () => {
  const data = await competitions.findById(parseInt(route.params.id as string))
  loading.value = false

  if (!data) {
    error.value = 'Wettkampf nicht gefunden'
    showError('Fehler beim Laden des Wettkampfs')
    return
  }

  state.value = data
})

async function onSubmit(data: Competition) {
  try {
    const { error } = await $fetch<ApiResponse<Competition>>(
      `/api/competitions/${route.params.id}`,
      {
        method: 'PATCH',
        body: data,
      }
    )

    if (error) throw new Error(error.message)

    showSuccess('Der Wettkampf wurde erfolgreich aktualisiert')

    setTimeout(async () => {
      // Weiterleitung zur Detailseite
      await navigateTo(`/competitions/${route.params.id}`)
    }, 500)
  } catch (error: any) {
    showError(error.message || 'Ein Fehler ist aufgetreten')
  }
}
</script>

<template>
  <BasePage
    heading="Wettkampf bearbeiten"
    :back-link="`/competitions/${route.params.id}`"
    back-link-text="Zurück zum Wettkampf"
    max-width="max-w-2xl"
  >
    <BaseLayer>
      <div v-if="loading" class="py-8 text-center">
        <UIcon name="i-lucide-loader" class="animate-spin text-3xl" />
      </div>
      <div v-else-if="error" class="py-8 text-center text-red-500">
        {{ error }}
      </div>
      <CompetitionForm
        v-else-if="state"
        v-model="state"
        :is-edit="true"
        @submit="onSubmit"
      />
    </BaseLayer>
  </BasePage>
</template>
