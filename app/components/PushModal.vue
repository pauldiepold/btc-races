<script setup lang="ts">
const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const push = usePushNotifications()
const loading = ref(false)

const mode = computed<'ios-install' | 'denied' | 'ready'>(() => {
  if (push.needsInstallFirst.value) return 'ios-install'
  if (push.isDenied.value) return 'denied'
  return 'ready'
})

const categories = [
  { icon: 'i-ph-user-plus', label: 'LADV-Meldung durch Coach' },
  { icon: 'i-ph-user-minus', label: 'LADV-Abmeldung durch Coach' },
  { icon: 'i-ph-calendar-x', label: 'Event abgesagt' },
  { icon: 'i-ph-bell', label: 'Meldefrist- und Event-Erinnerungen' },
]

const iosSteps = [
  { icon: 'i-ph-share-fat', text: 'Tippe unten in Safari auf das Teilen-Symbol.' },
  { icon: 'i-ph-plus-square', text: 'Wähle „Zum Home-Bildschirm" aus der Liste.' },
  { icon: 'i-ph-house', text: 'Öffne die App vom Home-Bildschirm.' },
  { icon: 'i-ph-bell-ringing', text: 'Komm hierher zurück und aktiviere Push.' },
]

async function onActivate() {
  loading.value = true
  try {
    const ok = await push.subscribe()
    if (ok) emit('update:open', false)
  }
  finally {
    loading.value = false
  }
}

function close() {
  emit('update:open', false)
}
</script>

<template>
  <UModal
    :open="props.open"
    @update:open="emit('update:open', $event)"
  >
    <template #content>
      <div class="p-6 space-y-5">
        <!-- Header -->
        <div class="flex items-center gap-3">
          <div class="size-10 rounded-full bg-yellow-500/15 flex items-center justify-center shrink-0">
            <UIcon
              name="i-ph-bell-ringing-bold"
              class="size-5 text-primary"
            />
          </div>
          <div>
            <h2 class="font-display font-semibold text-lg text-highlighted">
              Push-Benachrichtigungen
            </h2>
            <p class="text-sm text-muted">
              Bleib über deine Wettkämpfe auf dem Laufenden.
            </p>
          </div>
        </div>

        <!-- iOS: App erst installieren -->
        <div
          v-if="mode === 'ios-install'"
          class="space-y-4"
        >
          <div class="rounded-[--ui-radius] border border-default bg-muted p-4">
            <p class="text-sm text-highlighted font-medium mb-1">
              Auf dem iPhone nur als installierte App möglich
            </p>
            <p class="text-sm text-muted">
              Apple erlaubt Web-Push auf iOS nur, wenn du BTC Races zuerst zum Home-Bildschirm hinzufügst.
            </p>
          </div>

          <ol class="space-y-3">
            <li
              v-for="(step, i) in iosSteps"
              :key="i"
              class="flex items-start gap-3"
            >
              <span class="shrink-0 size-7 rounded-full bg-primary/15 text-primary text-sm font-semibold flex items-center justify-center">
                {{ i + 1 }}
              </span>
              <div class="flex items-center gap-2 pt-0.5">
                <UIcon
                  :name="step.icon"
                  class="size-5 text-muted shrink-0"
                />
                <span class="text-sm text-highlighted">{{ step.text }}</span>
              </div>
            </li>
          </ol>
        </div>

        <!-- Browser hat Permission blockiert -->
        <div
          v-else-if="mode === 'denied'"
          class="space-y-4"
        >
          <div class="rounded-[--ui-radius] border border-error/30 bg-error/10 p-4">
            <p class="text-sm text-highlighted font-medium mb-1">
              Im Browser blockiert
            </p>
            <p class="text-sm text-muted">
              Du hast Push-Benachrichtigungen für diese Seite abgelehnt. Sie lassen sich nur in den Browser-Einstellungen wieder freigeben.
            </p>
          </div>
          <p class="text-sm text-muted">
            Öffne die Seiten-Einstellungen deines Browsers (Schloss-Symbol in der Adressleiste) und erlaube Benachrichtigungen für diese Seite.
          </p>
        </div>

        <!-- Normale Aktivierung -->
        <div
          v-else
          class="space-y-4"
        >
          <p class="text-sm text-muted">
            Du erhältst Push-Benachrichtigungen zu folgenden Themen:
          </p>
          <ul class="space-y-2">
            <li
              v-for="cat in categories"
              :key="cat.label"
              class="flex items-center gap-3 text-sm text-highlighted"
            >
              <UIcon
                :name="cat.icon"
                class="size-5 text-primary shrink-0"
              />
              <span>{{ cat.label }}</span>
            </li>
          </ul>
          <p class="text-xs text-muted">
            Du kannst einzelne Kategorien später in deinen Benachrichtigungs-Einstellungen anpassen.
          </p>
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-2 pt-1 border-t border-default">
          <UButton
            label="Schließen"
            color="neutral"
            variant="ghost"
            @click="close"
          />
          <UButton
            v-if="mode === 'ready'"
            label="Push aktivieren"
            color="primary"
            icon="i-ph-bell-ringing-bold"
            :loading="loading"
            @click="onActivate"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
