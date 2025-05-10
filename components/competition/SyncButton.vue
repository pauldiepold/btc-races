<script setup lang="ts">
import { ref } from 'vue'
import type { Competition } from '~/types/models.types'
import { useToastMessages } from '~/composables/useToastMessages'

const props = defineProps<{
  competition: Competition | null
}>()

const user = useSupabaseUser()
const isSyncing = ref(false)
const { showSuccess, showError } = useToastMessages()

async function syncWithLadv() {
  if (!props.competition?.id) return

  try {
    isSyncing.value = true
    const { data, error } = await useFetch(
      `/api/competitions/${props.competition.id}/sync`,
      {
        method: 'POST',
      }
    )

    if (error.value) {
      throw error.value
    }

    if (data.value?.success) {
      showSuccess('Wettkampf wurde erfolgreich synchronisiert')
    }
  } catch (error: any) {
    showError(error.message || 'Synchronisation fehlgeschlagen')
  } finally {
    isSyncing.value = false
  }
}
</script>

<template>
  <UButton
    v-if="user && competition?.ladv_id"
    color="primary"
    :loading="isSyncing"
    @click="syncWithLadv"
  >
    Mit LADV synchronisieren
  </UButton>
</template>
