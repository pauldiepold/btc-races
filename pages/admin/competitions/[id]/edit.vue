<script setup lang="ts">
import type { ApiResponse } from '~/types/api'
import type { Database } from '~/types/database.types'

const route = useRoute()
const toast = useToast()
const client = useSupabaseClient<Database>()
const state = ref<Database['public']['Tables']['competitions']['Row']>()
const loading = ref(true)
const error = ref<string>()

onMounted(async () => {
  try {
    const { data, error: fetchError } = await client
      .from('competitions')
      .select('*')
      .eq('id', parseInt(route.params.id as string))
      .single()

    if (fetchError) throw fetchError
    if (!data) throw new Error('Wettkampf nicht gefunden')

    state.value = data
  } catch (err: any) {
    error.value = err.message || 'Fehler beim Laden des Wettkampfs'
    toast.add({
      title: 'Fehler',
      description: error.value,
      color: 'error',
    })
  } finally {
    loading.value = false
  }
})

async function onSubmit(
  data: Database['public']['Tables']['competitions']['Row']
) {
  try {
    const { error } = await $fetch<
      ApiResponse<Database['public']['Tables']['competitions']['Row']>
    >(`/api/competitions/${route.params.id}`, {
      method: 'PATCH',
      body: data,
    })

    if (error) throw new Error(error.message)

    toast.add({
      title: 'Erfolg',
      description: 'Der Wettkampf wurde erfolgreich aktualisiert.',
      color: 'success',
    })

    // Weiterleitung zur Detailseite
    setTimeout(async () => {
      await navigateTo(`/competitions/${route.params.id}`)
    }, 1500)
  } catch (error: any) {
    toast.add({
      title: 'Fehler',
      description: error.message || 'Ein Fehler ist aufgetreten.',
      color: 'error',
    })
  }
}
</script>

<template>
  <BasePage
    heading="Wettkampf bearbeiten"
    :back-link="`/competitions/${route.params.id}`"
    back-link-text="Zurück zum Wettkampf"
  >
    <BaseLayer class="max-w-2xl">
      <div v-if="loading" class="py-8 text-center">
        <UIcon name="lucide:loader" class="animate-spin text-3xl" />
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
