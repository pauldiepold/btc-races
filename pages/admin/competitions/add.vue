<script setup lang="ts">
import type { Database } from '~/types/database.types'
import {
  CHAMPIONSHIP_TYPES,
  RACE_TYPES,
  REGISTRATION_TYPES,
} from '~/types/enums'

const toast = useToast()

const state = ref<Partial<Database['public']['Tables']['competitions']['Row']>>(
  {
    name: undefined,
    location: undefined,
    registration_deadline: undefined,
    date: undefined,
    announcement_link: undefined,
    description: undefined,
    championship_type: CHAMPIONSHIP_TYPES[0],
    race_type: RACE_TYPES[0],
    registration_type: REGISTRATION_TYPES[0],
  }
)

async function onSubmit(
  data: Database['public']['Tables']['competitions']['Row']
) {
  try {
    const { error } = await $fetch('/api/competitions', {
      method: 'POST',
      body: data,
    })

    if (error) throw new Error(error.message)

    toast.add({
      title: 'Erfolg',
      description: 'Der Wettkampf wurde erfolgreich erstellt.',
      color: 'success',
    })

    // Weiterleitung zur Detailseite
    setTimeout(async () => {
      await navigateTo(`/competitions/${data.id}`)
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
    heading="Neuen Wettkampf erstellen"
    back-link="/"
    back-link-text="Zurück zur Übersicht"
  >
    <BaseLayer class="max-w-2xl">
      <CompetitionForm v-model="state" @submit="onSubmit" />
    </BaseLayer>
  </NuxtLayout>
</template>
