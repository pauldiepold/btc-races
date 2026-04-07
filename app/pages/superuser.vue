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
</script>

<template>
  <UContainer class="py-10 lg:py-14 max-w-2xl">
    <div class="mb-10">
      <h1 class="font-display font-semibold text-highlighted text-2xl">
        Superuser
      </h1>
      <p class="text-sm text-muted mt-1">
        Systemfunktionen
      </p>
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
  </UContainer>
</template>
