<script setup lang="ts">
import type { ThreadOverrideResponse } from '~~/server/api/threads/[id]/overrides.get'

type OverrideState = 'muted' | 'following' | null

const props = defineProps<{
  threadId: number | null
  /**
   * Mandatory-Raum (z. B. Ankündigungen): Mute/Follow ist gesperrt — die
   * Notification ist verpflichtend. UI rendert nur einen Hinweis-Button.
   */
  mandatory?: boolean
}>()

const toast = useToast()

const { data, refresh } = await useAsyncData<ThreadOverrideResponse | null>(
  () => `thread-override-${props.threadId ?? 'none'}`,
  async () => {
    if (props.threadId == null) return null
    return await $fetch<ThreadOverrideResponse>(`/api/threads/${props.threadId}/overrides`)
  },
  { default: () => null, watch: [() => props.threadId] },
)

const state = computed<OverrideState>(() => data.value?.state ?? null)
const saving = ref(false)

async function setState(next: OverrideState) {
  if (props.threadId == null || saving.value) return
  saving.value = true
  try {
    await $fetch(`/api/threads/${props.threadId}/overrides`, {
      method: 'PUT',
      body: { state: next },
    })
    await refresh()
    toast.add({
      title: next === 'muted'
        ? 'Stummgeschaltet'
        : next === 'following'
          ? 'Du folgst diesem Thread'
          : 'Auto-Empfang aktiv',
      color: 'success',
    })
  }
  catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Ein Fehler ist aufgetreten.'
    toast.add({ title: 'Fehler', description: msg, color: 'error' })
  }
  finally {
    saving.value = false
  }
}

const label = computed(() => {
  if (state.value === 'muted') return 'Stummgeschaltet'
  if (state.value === 'following') return 'Du folgst'
  return 'Benachrichtigungen'
})

const icon = computed(() => {
  if (state.value === 'muted') return 'i-ph-bell-slash'
  if (state.value === 'following') return 'i-ph-bell-ringing'
  return 'i-ph-bell'
})

const items = computed(() => [[
  {
    label: 'Automatisch (Standard)',
    icon: 'i-ph-bell',
    disabled: state.value === null,
    onSelect: () => setState(null),
  },
  {
    label: 'Folgen',
    icon: 'i-ph-bell-ringing',
    disabled: state.value === 'following',
    onSelect: () => setState('following'),
  },
  {
    label: 'Stummschalten',
    icon: 'i-ph-bell-slash',
    disabled: state.value === 'muted',
    onSelect: () => setState('muted'),
  },
]])
</script>

<template>
  <UTooltip
    v-if="threadId != null && mandatory"
    text="Verpflichtende Vereins-Ankündigung — kann nicht stummgeschaltet werden."
  >
    <UButton
      icon="i-ph-megaphone"
      label="Pflicht-Benachrichtigung"
      size="sm"
      color="neutral"
      variant="ghost"
      disabled
    />
  </UTooltip>
  <UDropdownMenu
    v-else-if="threadId != null"
    :items="items"
  >
    <UButton
      :icon="icon"
      :label="label"
      size="sm"
      color="neutral"
      variant="ghost"
      :loading="saving"
      trailing-icon="i-ph-caret-down"
    />
  </UDropdownMenu>
</template>
