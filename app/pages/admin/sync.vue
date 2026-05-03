<script setup lang="ts">
definePageMeta({ layout: 'admin', title: 'Sync' })

const { session } = useUserSession()
if (session.value?.user?.role !== 'admin' && session.value?.user?.role !== 'superuser') {
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

type LadvSyncResult = {
  result: string
  stats: {
    synced: number
    updated: number
    cancelled: number
    errors: number
    duration: string
  }
}

const ladvSyncLoading = ref(false)
const ladvSyncResult = ref<LadvSyncResult | null>(null)
const ladvSyncError = ref<string | null>(null)

async function runLadvSync() {
  ladvSyncLoading.value = true
  ladvSyncResult.value = null
  ladvSyncError.value = null
  try {
    ladvSyncResult.value = await $fetch<LadvSyncResult>('/api/admin/sync-ladv-events', { method: 'POST' })
  }
  catch (err: unknown) {
    ladvSyncError.value = err instanceof Error ? err.message : 'Unbekannter Fehler'
  }
  finally {
    ladvSyncLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
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

    <!-- LADV-Events-Sync -->
    <div class="rounded-[--ui-radius] border border-default p-6 space-y-5">
      <div>
        <h2 class="font-display font-semibold text-highlighted text-base">
          LADV-Events-Sync
        </h2>
        <p class="text-sm text-muted mt-1">
          Alle noch kommenden LADV-Events mit der LADV-API synchronisieren. Manuell überschriebene Felder bleiben erhalten.
        </p>
      </div>

      <UButton
        label="Sync anstoßen"
        icon="i-ph-arrows-clockwise"
        :loading="ladvSyncLoading"
        @click="runLadvSync"
      />

      <!-- Ergebnis -->
      <div
        v-if="ladvSyncResult"
        class="rounded-[--ui-radius] bg-success/10 border border-success/20 p-4 space-y-3"
      >
        <div class="flex items-center gap-2 text-sm font-medium text-success">
          <UIcon
            name="i-ph-check-circle-bold"
            class="size-4 shrink-0"
          />
          {{ ladvSyncResult.result }}
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="text-center">
            <p class="text-xl font-semibold text-highlighted">
              {{ ladvSyncResult.stats.synced }}
            </p>
            <p class="text-xs text-muted mt-0.5">
              Synchronisiert
            </p>
          </div>
          <div class="text-center">
            <p class="text-xl font-semibold text-highlighted">
              {{ ladvSyncResult.stats.updated }}
            </p>
            <p class="text-xs text-muted mt-0.5">
              Aktualisiert
            </p>
          </div>
          <div class="text-center">
            <p class="text-xl font-semibold text-highlighted">
              {{ ladvSyncResult.stats.cancelled }}
            </p>
            <p class="text-xs text-muted mt-0.5">
              Abgesagt
            </p>
          </div>
          <div class="text-center">
            <p class="text-xl font-semibold text-highlighted">
              {{ ladvSyncResult.stats.errors }}
            </p>
            <p class="text-xs text-muted mt-0.5">
              Fehler
            </p>
          </div>
        </div>
        <p class="text-xs text-muted text-right">
          Dauer: {{ ladvSyncResult.stats.duration }}
        </p>
      </div>

      <!-- Fehler -->
      <UAlert
        v-if="ladvSyncError"
        color="error"
        variant="subtle"
        icon="i-ph-warning-bold"
        title="Sync fehlgeschlagen"
        :description="ladvSyncError"
      />
    </div>
  </div>
</template>
