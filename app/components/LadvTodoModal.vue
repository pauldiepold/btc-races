<script setup lang="ts">
import type { LadvTodo } from '~~/shared/types/events'

const props = defineProps<{
  todo: LadvTodo
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'done': []
}>()

const toast = useToast()
const loading = ref(false)

const isRegister = computed(() => props.todo.type === 'register')

const ladvUrl = computed(() => {
  if (!props.todo.ladvId) return null
  return isRegister.value
    ? `https://ladv.de/meldung/addathlet/${props.todo.ladvId}`
    : `https://ladv.de/meldung/anmeldungen/${props.todo.ladvId}`
})

const fullName = computed(() =>
  [props.todo.firstName, props.todo.lastName].filter(Boolean).join(' ') || 'Unbekannt',
)

async function markDone() {
  loading.value = true
  try {
    const disciplines = isRegister.value ? props.todo.wishDisciplines : null
    await $fetch(`/api/registrations/${props.todo.registrationId}/ladv-stand`, {
      method: 'PUT',
      body: { disciplines },
    })
    emit('update:open', false)
    emit('done')
  }
  catch {
    toast.add({ title: 'Fehler beim Speichern', color: 'error' })
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal
    :open="open"
    @update:open="emit('update:open', $event)"
  >
    <template #content>
      <div class="p-6 space-y-5">
        <!-- Header -->
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <UAvatar
              :src="useAvatarUrl(todo.userId)"
              :alt="`${todo.firstName ?? ''} ${todo.lastName ?? ''}`"
              size="md"
              class="shrink-0"
            />
            <div class="min-w-0">
              <p class="font-semibold text-highlighted text-base">
                {{ fullName }}
              </p>
              <p class="text-sm text-muted mt-0.5">
                {{ todo.eventName }}
              </p>
            </div>
          </div>
          <UBadge
            :label="isRegister ? 'In LADV anmelden' : 'Von LADV abmelden'"
            :color="isRegister ? 'info' : 'error'"
            variant="subtle"
            class="shrink-0"
          />
        </div>

        <!-- Diff -->
        <div>
          <p class="text-xs font-medium text-muted uppercase tracking-widest mb-2">
            Änderungen
          </p>
          <div class="flex flex-wrap gap-1.5">
            <LadvBadge
              v-for="entry in todo.diff"
              :key="`${entry.discipline}:${entry.ageClass}`"
              :discipline="entry.discipline"
              :age-class="entry.ageClass"
              size="md"
            />
          </div>
        </div>

        <!-- LADV-Link -->
        <UButton
          v-if="ladvUrl"
          :to="ladvUrl"
          target="_blank"
          rel="noopener noreferrer"
          :icon="isRegister ? 'i-ph-user-plus' : 'i-ph-user-minus'"
          :label="isRegister ? 'In LADV anmelden' : 'LADV-Anmeldeliste öffnen'"
          :color="isRegister ? 'primary' : 'error'"
          trailing-icon="i-ph-arrow-up-right-bold"
          block
        />
        <p
          v-else
          class="text-xs text-muted"
        >
          Keine LADV-ID für dieses Event hinterlegt.
        </p>

        <!-- Footer -->
        <div class="flex justify-end gap-2 pt-1 border-t border-default">
          <UButton
            label="Schließen"
            color="neutral"
            variant="ghost"
            @click="emit('update:open', false)"
          />
          <UButton
            :label="isRegister ? 'Als in LADV angemeldet markieren' : 'Als in LADV abgemeldet markieren'"
            :color="isRegister ? 'success' : 'neutral'"
            :loading="loading"
            @click="markDone"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
