<script setup lang="ts">
import type { NotificationChannel } from '~~/shared/types/notifications'

const props = defineProps<{
  state: { enabled: boolean, mandatory: boolean }
  channel: NotificationChannel
  pushAvailable: boolean
}>()

const emit = defineEmits<{
  'update': [value: boolean]
  'request-push': []
}>()

const pushBlocked = computed(() => props.channel === 'push' && !props.pushAvailable)

const title = computed(() => {
  if (props.state.mandatory) return 'Diese Benachrichtigung ist verpflichtend und kann nicht deaktiviert werden.'
  if (pushBlocked.value) return 'Push-Benachrichtigungen sind nicht aktiviert. Klicken, um Push zu aktivieren.'
  return ''
})

function onUpdate(value: boolean) {
  if (props.state.mandatory) return
  if (pushBlocked.value) {
    emit('request-push')
    return
  }
  emit('update', value)
}
</script>

<template>
  <div
    class="flex items-center gap-1.5"
    :title="title || undefined"
  >
    <button
      v-if="pushBlocked"
      type="button"
      class="inline-flex items-center justify-center size-8 rounded-full text-muted hover:text-primary hover:bg-elevated transition-colors"
      @click="emit('request-push')"
    >
      <UIcon
        name="i-ph-bell-slash"
        class="size-4"
      />
      <span class="sr-only">Push aktivieren</span>
    </button>

    <USwitch
      v-else
      :model-value="state.enabled"
      :disabled="state.mandatory"
      size="md"
      @update:model-value="onUpdate"
    />

    <UIcon
      v-if="state.mandatory"
      name="i-ph-lock-simple"
      class="size-3.5 text-muted"
    />
  </div>
</template>
