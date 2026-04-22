<script setup lang="ts">
definePageMeta({ title: 'Superuser' })

const { session } = useUserSession()
if (session.value?.user?.role !== 'superuser') {
  await navigateTo('/')
}

type SyncResult = {
  result: string
  stats: {
    created: number
    updated: number
    skipped: number
    deactivated: number
    duration: string
  }
}

const syncLoading = ref(false)
const syncResult = ref<SyncResult | null>(null)
const syncError = ref<string | null>(null)

async function runSync() {
  syncLoading.value = true
  syncResult.value = null
  syncError.value = null
  try {
    syncResult.value = await $fetch<SyncResult>('/api/admin/sync-members', { method: 'POST' })
  }
  catch (err: unknown) {
    syncError.value = err instanceof Error ? err.message : 'Unbekannter Fehler'
  }
  finally {
    syncLoading.value = false
  }
}

type SeedResult = { result: string }

const seedLoading = ref(false)
const seedResult = ref<SeedResult | null>(null)
const seedError = ref<string | null>(null)

async function runSeed() {
  seedLoading.value = true
  seedResult.value = null
  seedError.value = null
  try {
    seedResult.value = await $fetch<SeedResult>('/api/superuser/seed', { method: 'POST' })
  }
  catch (err: unknown) {
    seedError.value = err instanceof Error ? err.message : 'Unbekannter Fehler'
  }
  finally {
    seedLoading.value = false
  }
}

const toast = useToast()
const pushTestLoading = ref(false)
const pushTestError = ref<string | null>(null)
const pushTestConfirmOpen = ref(false)

type PushTestResult = {
  ok: boolean
  stats: {
    subscriptions: number
    users: number
    sent: number
    expired: number
    failed: number
  }
}

async function runPushTest() {
  pushTestConfirmOpen.value = false
  pushTestLoading.value = true
  pushTestError.value = null
  try {
    const res = await $fetch<PushTestResult>('/api/superuser/test-push', { method: 'POST' })
    const { sent, failed, expired, users, subscriptions } = res.stats
    toast.add({
      title: 'Test-Push versendet',
      description: `${sent}/${subscriptions} Subscriptions (${users} User) · ${expired} abgelaufen · ${failed} Fehler`,
      color: failed > 0 ? 'warning' : 'success',
    })
  }
  catch (err: unknown) {
    pushTestError.value = err instanceof Error ? err.message : 'Unbekannter Fehler'
  }
  finally {
    pushTestLoading.value = false
  }
}
</script>

<template>
  <UContainer class="py-10 lg:py-14 max-w-2xl">
    <div class="mb-8">
      <h1 class="font-display font-semibold text-highlighted text-2xl">
        Superuser
      </h1>
      <p class="text-sm text-muted mt-1">
        Systemfunktionen
      </p>
    </div>

    <!-- Sub-Navigation -->
    <div class="flex gap-2 mb-8 border-b border-default">
      <NuxtLink
        to="/superuser"
        class="px-4 py-2 text-sm font-medium text-highlighted border-b-2 border-primary"
      >
        System
      </NuxtLink>
      <NuxtLink
        to="/superuser/notifications"
        class="px-4 py-2 text-sm font-medium text-muted hover:text-highlighted transition-colors border-b-2 border-transparent"
      >
        Notifications
      </NuxtLink>
    </div>

    <!-- DB-Seed -->
    <div class="rounded-[--ui-radius] border border-error/40 p-6 space-y-5">
      <div>
        <h2 class="font-display font-semibold text-highlighted text-base">
          DB-Seed
        </h2>
        <p class="text-sm text-muted mt-1">
          Datenbank vollständig leeren und mit Testdaten befüllen. <span class="text-error font-medium">Alle vorhandenen Daten gehen verloren.</span>
        </p>
      </div>

      <UButton
        label="Seed ausführen"
        icon="i-ph-database-bold"
        color="error"
        variant="subtle"
        :loading="seedLoading"
        @click="runSeed"
      />

      <!-- Ergebnis -->
      <div
        v-if="seedResult"
        class="rounded-[--ui-radius] bg-success/10 border border-success/20 p-4"
      >
        <div class="flex items-center gap-2 text-sm font-medium text-success">
          <UIcon
            name="i-ph-check-circle-bold"
            class="size-4 shrink-0"
          />
          {{ seedResult.result }}
        </div>
      </div>

      <!-- Fehler -->
      <UAlert
        v-if="seedError"
        color="error"
        variant="subtle"
        icon="i-ph-warning-bold"
        title="Seed fehlgeschlagen"
        :description="seedError"
      />
    </div>

    <!-- Campai-Sync -->
    <div class="rounded-[--ui-radius] border border-default p-6 space-y-5">
      <div>
        <h2 class="font-display font-semibold text-highlighted text-base">
          Campai-Sync
        </h2>
        <p class="text-sm text-muted mt-1">
          Mitgliederdaten von der Campai-API in die lokale Datenbank synchronisieren.
        </p>
      </div>

      <UButton
        label="Sync anstoßen"
        icon="i-ph-arrows-clockwise"
        :loading="syncLoading"
        @click="runSync"
      />

      <!-- Ergebnis -->
      <div
        v-if="syncResult"
        class="rounded-[--ui-radius] bg-success/10 border border-success/20 p-4 space-y-3"
      >
        <div class="flex items-center gap-2 text-sm font-medium text-success">
          <UIcon
            name="i-ph-check-circle-bold"
            class="size-4 shrink-0"
          />
          {{ syncResult.result }}
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="text-center">
            <p class="text-xl font-semibold text-highlighted">
              {{ syncResult.stats.created }}
            </p>
            <p class="text-xs text-muted mt-0.5">
              Neu angelegt
            </p>
          </div>
          <div class="text-center">
            <p class="text-xl font-semibold text-highlighted">
              {{ syncResult.stats.updated }}
            </p>
            <p class="text-xs text-muted mt-0.5">
              Aktualisiert
            </p>
          </div>
          <div class="text-center">
            <p class="text-xl font-semibold text-highlighted">
              {{ syncResult.stats.deactivated }}
            </p>
            <p class="text-xs text-muted mt-0.5">
              Deaktiviert
            </p>
          </div>
          <div class="text-center">
            <p class="text-xl font-semibold text-highlighted">
              {{ syncResult.stats.skipped }}
            </p>
            <p class="text-xs text-muted mt-0.5">
              Übersprungen
            </p>
          </div>
        </div>
        <p class="text-xs text-muted text-right">
          Dauer: {{ syncResult.stats.duration }}
        </p>
      </div>

      <!-- Fehler -->
      <UAlert
        v-if="syncError"
        color="error"
        variant="subtle"
        icon="i-ph-warning-bold"
        title="Sync fehlgeschlagen"
        :description="syncError"
      />
    </div>

    <!-- Push-Test -->
    <div class="rounded-[--ui-radius] border border-error/40 p-6 space-y-5 mt-6">
      <div>
        <h2 class="font-display font-semibold text-highlighted text-base">
          Push-Test an alle
        </h2>
        <p class="text-sm text-muted mt-1">
          Sendet eine Test-Push-Notification an <span class="text-error font-medium">alle User mit aktivierter Push-Subscription</span>.
        </p>
      </div>

      <UButton
        label="Test-Push an alle senden"
        icon="i-ph-bell-ringing-bold"
        color="error"
        variant="subtle"
        :loading="pushTestLoading"
        @click="pushTestConfirmOpen = true"
      />

      <UAlert
        v-if="pushTestError"
        color="error"
        variant="subtle"
        icon="i-ph-warning-bold"
        title="Push fehlgeschlagen"
        :description="pushTestError"
      />
    </div>

    <UModal v-model:open="pushTestConfirmOpen">
      <template #content>
        <div class="p-6 space-y-5">
          <div class="flex items-start gap-3">
            <UIcon
              name="i-ph-warning-bold"
              class="size-6 shrink-0 text-error"
            />
            <div>
              <h3 class="font-display font-semibold text-highlighted text-base">
                Test-Push an alle User senden?
              </h3>
              <p class="text-sm text-muted mt-1">
                Diese Aktion versendet eine Test-Benachrichtigung an <span class="text-error font-medium">alle User mit aktivierter Push-Subscription</span>. Nur zum Testen verwenden.
              </p>
            </div>
          </div>
          <div class="flex justify-end gap-2 pt-2 border-t border-default">
            <UButton
              label="Abbrechen"
              color="neutral"
              variant="ghost"
              @click="pushTestConfirmOpen = false"
            />
            <UButton
              label="Ja, an alle senden"
              color="error"
              :loading="pushTestLoading"
              @click="runPushTest"
            />
          </div>
        </div>
      </template>
    </UModal>
  </UContainer>
</template>
