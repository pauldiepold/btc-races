<script setup lang="ts">
import type {
  NotificationPreferenceEntry,
  NotificationPreferencesResponse,
} from '~~/server/notifications/meta'
import type { NotificationChannel } from '~~/shared/types/notifications'

definePageMeta({ layout: 'profil', title: 'Benachrichtigungen' })

const toast = useToast()
const push = usePushNotifications()
const modalOpen = ref(false)

onMounted(async () => {
  await push.init({ reconcile: true })
})

const { data, status, error, refresh } = await useFetch<NotificationPreferencesResponse>(
  '/api/user/notification-preferences',
)

// Lokaler reaktiver State - wird bei Fetch-Response synchronisiert.
const preferences = ref<NotificationPreferenceEntry[]>([])

watchEffect(() => {
  if (data.value?.preferences) {
    preferences.value = JSON.parse(JSON.stringify(data.value.preferences)) as NotificationPreferenceEntry[]
  }
})

const pushSyncPending = computed(() => push.serverSyncStatus.value === 'pending')

const showPushServerDrift = computed(
  () =>
    push.serverSyncStatus.value === 'failed'
    && push.isSubscribed.value
    && push.isGranted.value
    && !push.needsInstallFirst.value,
)

const pushAvailable = computed(() => push.isPushChannelAvailable.value)

const userPreferences = computed(() => preferences.value.filter(p => !p.adminOnly))
const adminPreferences = computed(() => preferences.value.filter(p => p.adminOnly))

const sections = computed(() => {
  const result: { key: string, title: string, description?: string, entries: NotificationPreferenceEntry[] }[] = [
    {
      key: 'user',
      title: 'Persönliche Benachrichtigungen',
      entries: userPreferences.value,
    },
  ]
  if (adminPreferences.value.length) {
    result.push({
      key: 'admin',
      title: 'Admin-Benachrichtigungen',
      description: 'Benachrichtigungen für Coaches und Admins rund um Meldungen und Fristen.',
      entries: adminPreferences.value,
    })
  }
  return result
})

function openPushModal() {
  modalOpen.value = true
}

async function retryPushReconcile() {
  await push.reconcileWithServer()
  if (push.serverSyncStatus.value === 'synced') {
    toast.add({ title: 'Push-Verbindung wiederhergestellt', color: 'success' })
  }
  else if (push.serverSyncStatus.value === 'failed') {
    toast.add({
      title: 'Verbindung fehlgeschlagen',
      description: 'Bitte versuche es erneut.',
      color: 'error',
    })
  }
}

async function toggle(entry: NotificationPreferenceEntry, channel: NotificationChannel, next: boolean) {
  const state = entry[channel]
  if (state.mandatory) return

  const previous = state.enabled
  state.enabled = next

  try {
    await $fetch('/api/user/notification-preferences', {
      method: 'PUT',
      body: {
        preferences: [{ type: entry.type, channel, enabled: next }],
      },
    })
  }
  catch {
    state.enabled = previous
    toast.add({
      title: 'Speichern fehlgeschlagen',
      description: 'Bitte versuche es erneut.',
      color: 'error',
    })
  }
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h2 class="font-display font-semibold text-highlighted text-lg">
        Benachrichtigungen
      </h2>
      <p class="text-sm text-muted mt-1">
        Entscheide selbst, worüber wir dich per E-Mail oder Push informieren dürfen.
      </p>
    </div>

    <div
      v-if="pushSyncPending"
      class="mb-5 rounded-[--ui-radius] border border-default bg-muted/50 p-4 flex items-start gap-3"
    >
      <UIcon
        name="i-ph-arrows-clockwise"
        class="size-5 text-muted shrink-0 mt-0.5 animate-spin"
      />
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-highlighted">
          Stelle die Push-Verbindung mit dem Server her …
        </p>
        <p class="text-xs text-muted mt-0.5">
          Einen Moment, die Einstellungen werden abgeglichen.
        </p>
      </div>
    </div>

    <div
      v-else-if="showPushServerDrift"
      class="mb-5 rounded-[--ui-radius] border border-amber-500/40 bg-amber-500/10 p-4 flex items-start gap-3"
    >
      <UIcon
        name="i-ph-warning"
        class="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
      />
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-highlighted">
          Push auf dem Gerät erkannt, Server nicht erreicht
        </p>
        <p class="text-xs text-muted mt-0.5">
          Dein Browser ist bereit, aber die Registrierung fehlt auf dem Server (z. B. nach einem Datenbank-Reset). Verbinde die Registrierung erneut.
        </p>
      </div>
      <UButton
        label="Erneut verbinden"
        color="primary"
        variant="soft"
        size="xs"
        icon="i-ph-arrows-clockwise"
        @click="retryPushReconcile"
      />
    </div>

    <div
      v-else-if="!pushAvailable"
      class="mb-5 rounded-[--ui-radius] border border-default bg-muted/50 p-4 flex items-start gap-3"
    >
      <UIcon
        name="i-ph-bell-slash"
        class="size-5 text-muted shrink-0 mt-0.5"
      />
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-highlighted">
          Push-Benachrichtigungen sind nicht aktiviert
        </p>
        <p class="text-xs text-muted mt-0.5">
          Aktiviere Push, um Benachrichtigungen auch auf deinem Gerät zu erhalten.
        </p>
      </div>
      <UButton
        label="Aktivieren"
        color="primary"
        variant="soft"
        size="xs"
        icon="i-ph-bell-ringing"
        @click="openPushModal"
      />
    </div>

    <div
      v-if="status === 'pending' && !preferences.length"
      class="space-y-2"
    >
      <USkeleton
        v-for="i in 6"
        :key="i"
        class="h-16 w-full"
      />
    </div>

    <div
      v-else-if="error"
      class="rounded-[--ui-radius] border border-error/30 bg-error/10 p-4 text-sm text-highlighted flex items-center justify-between gap-3"
    >
      <span>Einstellungen konnten nicht geladen werden.</span>
      <UButton
        label="Erneut versuchen"
        color="neutral"
        variant="outline"
        size="xs"
        @click="refresh()"
      />
    </div>

    <div
      v-else
      class="space-y-6"
    >
      <section
        v-for="section in sections"
        :key="section.key"
      >
        <div class="mb-2">
          <h3 class="text-sm font-semibold text-highlighted">
            {{ section.title }}
          </h3>
          <p
            v-if="section.description"
            class="text-xs text-muted mt-0.5"
          >
            {{ section.description }}
          </p>
        </div>

        <div class="rounded-[--ui-radius] border border-default overflow-hidden">
          <div
            class="hidden sm:grid grid-cols-[1fr_5rem_5rem] items-center gap-3 px-4 py-2.5 bg-elevated/60 text-xs font-medium uppercase tracking-wide text-muted"
          >
            <span>Kategorie</span>
            <span class="text-center">E-Mail</span>
            <span class="text-center">Push</span>
          </div>

          <ul class="divide-y divide-default">
            <li
              v-for="entry in section.entries"
              :key="entry.type"
              class="px-4 py-3 grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_5rem_5rem] items-center gap-x-3 gap-y-3"
            >
              <div class="min-w-0 col-span-2 sm:col-span-1">
                <p class="text-sm font-medium text-highlighted">
                  {{ entry.label }}
                </p>
                <p class="text-xs text-muted mt-0.5">
                  {{ entry.description }}
                </p>
              </div>

              <!-- Mobile: Toggles mit Label unter dem Eintrag -->
              <div class="flex items-center gap-6 justify-end sm:hidden col-span-2">
                <div class="flex items-center gap-2">
                  <span class="text-xs text-muted">E-Mail</span>
                  <PreferenceToggle
                    :state="entry.email"
                    :push-available="pushAvailable"
                    channel="email"
                    @update="(val: boolean) => toggle(entry, 'email', val)"
                    @request-push="openPushModal"
                  />
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-muted">Push</span>
                  <PreferenceToggle
                    :state="entry.push"
                    :push-available="pushAvailable"
                    channel="push"
                    @update="(val: boolean) => toggle(entry, 'push', val)"
                    @request-push="openPushModal"
                  />
                </div>
              </div>

              <!-- Desktop: Spalten-Toggles -->
              <div class="hidden sm:flex justify-center">
                <PreferenceToggle
                  :state="entry.email"
                  :push-available="pushAvailable"
                  channel="email"
                  @update="(val: boolean) => toggle(entry, 'email', val)"
                  @request-push="openPushModal"
                />
              </div>
              <div class="hidden sm:flex justify-center">
                <PreferenceToggle
                  :state="entry.push"
                  :push-available="pushAvailable"
                  channel="push"
                  @update="(val: boolean) => toggle(entry, 'push', val)"
                  @request-push="openPushModal"
                />
              </div>
            </li>
          </ul>
        </div>
      </section>
    </div>

    <PushModal v-model:open="modalOpen" />
  </div>
</template>
