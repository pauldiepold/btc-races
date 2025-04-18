<script setup lang="ts">
import type { ApiResponse } from '~/types/api'
import type { Database } from '~/types/database.types'

const route = useRoute()
const toast = useToast()
const client = useSupabaseClient<Database>()

// Lade existierende Daten
const { data: competition } = await useAsyncData(
  `competition-${route.params.id}`,
  async () => {
    const { data } = await client
      .from('competitions')
      .select('*')
      .eq('id', parseInt(route.params.id as string))
      .single()

    return data
  }
)

const state = ref<Partial<Database['public']['Tables']['competitions']['Row']>>(
  competition.value || {}
)

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
  <NuxtLayout
    name="base"
    heading="Wettkampf bearbeiten"
    :back-link="`/competitions/${route.params.id}`"
    back-link-text="Zurück zum Wettkampf"
  >
    <BaseLayer class="max-w-2xl">
      <CompetitionForm
        v-if="competition"
        v-model="state"
        :is-edit="true"
        @submit="onSubmit"
      />
    </BaseLayer>
  </NuxtLayout>
</template>
