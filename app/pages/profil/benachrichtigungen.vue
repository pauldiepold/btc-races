<script setup lang="ts">
import type {
  NotificationPreferenceChannelState,
  NotificationPreferenceEntry,
  NotificationPreferencesResponse,
} from '~~/server/notifications/meta'
import type { NotificationChannel, NotificationType } from '~~/shared/types/notifications'

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

interface PreferenceGroupDef {
  key: string
  label?: string
  description?: string
  types: NotificationType[]
}

// Reihenfolge in diesem Array bestimmt die UI-Reihenfolge.
// Trennung persönlich/admin ergibt sich aus adminOnly der enthaltenen Types (siehe NOTIFICATION_META).
// Bei Multi-Type-Gruppen werden Toggles für alle Types gleichzeitig in einem PUT gesetzt — Voraussetzung:
// alle Types einer Gruppe haben identische Defaults (siehe NOTIFICATION_DEFAULTS).
// label/description sind optional — bei Single-Type-Einträgen wird auf die Server-Meta zurückgefallen.
const PREFERENCE_GROUPS: PreferenceGroupDef[] = [
  // Persönlich
  { key: 'new_event', types: ['new_event'] },
  { key: 'event_changed', types: ['event_changed'] },
  { key: 'event_canceled', types: ['event_canceled'] },
  { key: 'registration_confirmation', types: ['registration_confirmation'] },
  {
    key: 'admin_registration',
    label: 'Anmeldung durch Admin',
    description: 'Wenn ein Admin dich für einen Wettkampf anmeldet oder deine Anmeldung ändert.',
    types: ['admin_registered_member', 'admin_changed_member_registration'],
  },
  {
    key: 'ladv',
    label: 'LADV-Meldung',
    description: 'Wenn der Coach dich in LADV gemeldet oder wieder abgemeldet hat.',
    types: ['ladv_registered', 'ladv_canceled'],
  },
  {
    key: 'reminders',
    label: 'Erinnerungen',
    description: '5 Tage vor Meldeschluss und 2 Tage vor Eventbeginn.',
    types: ['reminder_deadline_athlete', 'reminder_event'],
  },
  // Admin
  { key: 'reminder_deadline_admin', types: ['reminder_deadline_admin'] },
  {
    key: 'admin_athlete_changes',
    label: 'Athleten-Änderungen nach LADV-Meldung',
    description: 'Wenn ein Mitglied seinen Wunschstand ändert oder die Anmeldung storniert, nachdem in LADV gemeldet wurde.',
    types: ['athlete_changed_after_ladv', 'athlete_canceled_after_ladv'],
  },
]

interface DisplayEntry {
  key: string
  label: string
  description: string
  adminOnly: boolean
  types: NotificationType[]
  email: NotificationPreferenceChannelState
  push: NotificationPreferenceChannelState
}

function aggregateChannelState(
  entries: NotificationPreferenceEntry[],
  channel: NotificationChannel,
): NotificationPreferenceChannelState {
  return {
    enabled: entries.every(e => e[channel].enabled),
    mandatory: entries.some(e => e[channel].mandatory),
  }
}

const displayEntries = computed<DisplayEntry[]>(() => {
  const byType = new Map(preferences.value.map(p => [p.type, p]))
  const result: DisplayEntry[] = []

  for (const group of PREFERENCE_GROUPS) {
    const members = group.types.map(t => byType.get(t)).filter((p): p is NotificationPreferenceEntry => !!p)
    if (!members.length) continue
    const fallback = members[0]!
    result.push({
      key: group.key,
      label: group.label ?? fallback.label,
      description: group.description ?? fallback.description,
      adminOnly: members.every(m => m.adminOnly),
      types: members.map(m => m.type),
      email: aggregateChannelState(members, 'email'),
      push: aggregateChannelState(members, 'push'),
    })
  }

  return result
})

const userEntries = computed(() => displayEntries.value.filter(e => !e.adminOnly))
const adminEntries = computed(() => displayEntries.value.filter(e => e.adminOnly))

const sections = computed(() => {
  const result: { key: string, title: string, description?: string, entries: DisplayEntry[] }[] = [
    {
      key: 'user',
      title: 'Persönliche Benachrichtigungen',
      entries: userEntries.value,
    },
  ]
  if (adminEntries.value.length) {
    result.push({
      key: 'admin',
      title: 'Admin-Benachrichtigungen',
      description: 'Benachrichtigungen für Coaches und Admins rund um Meldungen und Fristen.',
      entries: adminEntries.value,
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

async function toggle(entry: DisplayEntry, channel: NotificationChannel, next: boolean) {
  if (entry[channel].mandatory) return

  const affected = preferences.value.filter(p => entry.types.includes(p.type))
  const previous = affected.map(p => ({ type: p.type, enabled: p[channel].enabled }))

  for (const p of affected) {
    if (!p[channel].mandatory) p[channel].enabled = next
  }

  try {
    await $fetch('/api/user/notification-preferences', {
      method: 'PUT',
      body: {
        preferences: affected
          .filter(p => !p[channel].mandatory)
          .map(p => ({ type: p.type, channel, enabled: next })),
      },
    })
  }
  catch {
    for (const prev of previous) {
      const p = preferences.value.find(x => x.type === prev.type)
      if (p) p[channel].enabled = prev.enabled
    }
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
              :key="entry.key"
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
