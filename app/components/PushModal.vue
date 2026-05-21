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

async function openGuide() {
  emit('update:open', false)
  await navigateTo('/installieren')
}

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
    <template #header>
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
    </template>

    <template #body>
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
            Apple erlaubt Web-Push auf iOS nur für die installierte App. Füge Berlin Track Club
            zum Home-Bildschirm hinzu, öffne sie von dort und komm dann hierher zurück, um Push zu aktivieren.
          </p>
        </div>
        <p class="text-sm text-muted">
          Die Anleitung zeigt dir Schritt für Schritt, wie du die App installierst.
        </p>
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
    </template>

    <template #footer>
      <div class="flex gap-2 ml-auto">
        <UButton
          label="Schließen"
          color="neutral"
          variant="ghost"
          @click="close"
        />
        <UButton
          v-if="mode === 'ios-install'"
          label="Anleitung öffnen"
          color="primary"
          icon="i-ph-arrow-right"
          trailing
          @click="openGuide"
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
    </template>
  </UModal>
</template>
