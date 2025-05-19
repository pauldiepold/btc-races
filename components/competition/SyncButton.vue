<script setup lang="ts">
import { ref } from 'vue'
import type { Competition } from '~/types/models.types'
import { useToastMessages } from '~/composables/useToastMessages'

const props = defineProps<{
  competition: Competition | null
}>()

const emit = defineEmits<{
  'sync-success': []
}>()

const user = useSupabaseUser()
const isSyncing = ref(false)
const { showSuccess, showError } = useToastMessages()

async function syncWithLadv() {
  if (!props.competition?.id) return

  try {
    isSyncing.value = true
    const response = await $fetch(
      `/api/competitions/${props.competition.id}/sync`,
      {
        method: 'POST',
      }
    )

    if (response.success) {
      showSuccess('Wettkampf wurde erfolgreich synchronisiert')
      emit('sync-success')
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
    color="neutral"
    variant="outline"
    icon="i-lucide-refresh-cw"
    :loading="isSyncing"
    class="w-full justify-center lg:w-auto lg:justify-start"
    @click="syncWithLadv"
  >
    LADV-Sync
  </UButton>
</template>
