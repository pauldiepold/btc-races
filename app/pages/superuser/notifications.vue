<script setup lang="ts">
import type { NotificationType } from '~~/shared/types/notifications'

definePageMeta({ title: 'Superuser — Notifications' })

const { session } = useUserSession()
if (session.value?.user?.role !== 'superuser') {
  await navigateTo('/')
}

type JobStatus = 'pending' | 'processing' | 'done' | 'failed'

interface Delivery {
  channel: 'email' | 'push'
  recipientId: number
  recipientName: string
  status: 'sent' | 'failed'
  error: string | null
  sentAt: string | null
}

interface NotificationJobItem {
  id: number
  type: NotificationType
  status: JobStatus
  attempts: number
  error: string | null
  payload: Record<string, unknown>
  createdAt: string
  processedAt: string | null
  deliveries: Delivery[]
  deliveryCount: number
}

interface NotificationsResponse {
  items: NotificationJobItem[]
  pagination: { total: number, page: number, limit: number, pages: number }
  stats: { total: number, pending: number, processing: number, done: number, failed: number }
}

interface ProcessQueueResponse {
  processed: number
  succeeded: number
  failed: number
  resetOrphans: number
}

const statusOptions = [
  { value: 'all', label: 'Alle' },
  { value: 'pending', label: 'Ausstehend' },
  { value: 'processing', label: 'In Bearbeitung' },
  { value: 'done', label: 'Erledigt' },
  { value: 'failed', label: 'Fehlgeschlagen' },
]

const typeLabels: Record<NotificationType, string> = {
  admin_registered_member: 'Admin-Anmeldung',
  admin_changed_member_registration: 'Admin-Änderung',
  ladv_registered: 'LADV-Meldung',
  ladv_canceled: 'LADV-Abmeldung',
  athlete_changed_after_ladv: 'Wunschstand geändert',
  event_canceled: 'Event abgesagt',
  event_changed: 'Event geändert',
  new_event: 'Neues Event',
  reminder_deadline_athlete: 'Meldefrist (Athlet)',
  reminder_deadline_admin: 'Meldefrist (Admin)',
  reminder_event: 'Event in 2 Tagen',
}

const typeOptions = [
  { value: 'all', label: 'Alle Typen' },
  ...Object.entries(typeLabels).map(([value, label]) => ({ value, label })),
]

const filterStatus = ref<string>('all')
const filterType = ref<string>('all')
const page = ref(1)
const limit = ref(20)
const expandedJobId = ref<number | null>(null)

const query = computed(() => ({
  status: filterStatus.value,
  ...(filterType.value !== 'all' ? { type: filterType.value } : {}),
  page: page.value,
  limit: limit.value,
}))

const { data, refresh, status: loadStatus } = await useFetch<NotificationsResponse>(
  '/api/admin/notifications',
  { query },
)

watch([filterStatus, filterType], () => {
  page.value = 1
})

function statusColor(status: JobStatus) {
  return ({
    pending: 'warning',
    processing: 'info',
    done: 'success',
    failed: 'error',
  } as const)[status]
}

function deliveryColor(status: Delivery['status']) {
  return status === 'sent' ? 'success' : 'error'
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '–'
  return new Date(iso).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const retryLoading = ref<number | null>(null)
const runQueueLoading = ref(false)
const toast = useToast()

async function retry(jobId: number) {
  retryLoading.value = jobId
  try {
    await $fetch(`/api/admin/notifications/${jobId}/retry`, { method: 'POST' })
    toast.add({ title: 'Job zurückgesetzt', description: `Job #${jobId} wird beim nächsten Queue-Lauf erneut verarbeitet.`, color: 'success' })
    await refresh()
  }
  catch (err: unknown) {
    toast.add({
      title: 'Retry fehlgeschlagen',
      description: err instanceof Error ? err.message : 'Unbekannter Fehler',
      color: 'error',
    })
  }
  finally {
    retryLoading.value = null
  }
}

async function runQueue() {
  runQueueLoading.value = true
  try {
    const result = await $fetch<ProcessQueueResponse>('/api/admin/notifications/process', {
      method: 'POST',
    })
    toast.add({
      title: 'Queue verarbeitet',
      description: `Verarbeitet: ${result.processed} · Erfolgreich: ${result.succeeded} · Fehlgeschlagen: ${result.failed} · Zurückgesetzt: ${result.resetOrphans}`,
      color: 'success',
    })
    await refresh()
  }
  catch (err: unknown) {
    toast.add({
      title: 'Queue-Lauf fehlgeschlagen',
      description: err instanceof Error ? err.message : 'Unbekannter Fehler',
      color: 'error',
    })
  }
  finally {
    runQueueLoading.value = false
  }
}

function toggleExpand(id: number) {
  expandedJobId.value = expandedJobId.value === id ? null : id
}
</script>

<template>
  <UContainer class="py-10 lg:py-14 max-w-5xl">
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
        class="px-4 py-2 text-sm font-medium text-muted hover:text-highlighted transition-colors border-b-2 border-transparent"
      >
        System
      </NuxtLink>
      <NuxtLink
        to="/superuser/notifications"
        class="px-4 py-2 text-sm font-medium text-highlighted border-b-2 border-primary"
      >
        Notifications
      </NuxtLink>
    </div>

    <!-- Statistiken -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <div class="rounded-[--ui-radius] border border-default p-4">
        <p class="text-xs text-muted">
          Gesamt
        </p>
        <p class="text-2xl font-semibold text-highlighted mt-1">
          {{ data?.stats.total ?? 0 }}
        </p>
      </div>
      <div class="rounded-[--ui-radius] border border-default p-4">
        <p class="text-xs text-muted">
          Ausstehend
        </p>
        <p class="text-2xl font-semibold text-warning mt-1">
          {{ (data?.stats.pending ?? 0) + (data?.stats.processing ?? 0) }}
        </p>
      </div>
      <div class="rounded-[--ui-radius] border border-default p-4">
        <p class="text-xs text-muted">
          Erledigt
        </p>
        <p class="text-2xl font-semibold text-success mt-1">
          {{ data?.stats.done ?? 0 }}
        </p>
      </div>
      <div class="rounded-[--ui-radius] border border-default p-4">
        <p class="text-xs text-muted">
          Fehlgeschlagen
        </p>
        <p class="text-2xl font-semibold text-error mt-1">
          {{ data?.stats.failed ?? 0 }}
        </p>
      </div>
    </div>

    <!-- Filter -->
    <div class="flex flex-wrap items-end gap-3 mb-4">
      <UFormField
        label="Status"
        size="sm"
        class="min-w-[10rem]"
      >
        <USelect
          v-model="filterStatus"
          :items="statusOptions"
          value-key="value"
        />
      </UFormField>
      <UFormField
        label="Typ"
        size="sm"
        class="min-w-[14rem]"
      >
        <USelect
          v-model="filterType"
          :items="typeOptions"
          value-key="value"
        />
      </UFormField>
      <UButton
        icon="i-ph-arrows-clockwise"
        label="Aktualisieren"
        color="neutral"
        variant="outline"
        size="sm"
        :loading="loadStatus === 'pending'"
        @click="refresh()"
      />
      <UButton
        icon="i-ph-play-circle"
        label="Queue verarbeiten"
        color="primary"
        variant="solid"
        size="sm"
        :loading="runQueueLoading"
        :disabled="runQueueLoading"
        @click="runQueue()"
      />
    </div>

    <!-- Loading-State -->
    <div
      v-if="loadStatus === 'pending' && !data"
      class="space-y-3"
    >
      <USkeleton
        v-for="i in 5"
        :key="i"
        class="h-16 w-full"
      />
    </div>

    <!-- Leer -->
    <div
      v-else-if="!data?.items.length"
      class="text-center py-20 text-muted space-y-3"
    >
      <UIcon
        name="i-ph-tray"
        class="size-12 mx-auto opacity-60"
      />
      <p class="font-medium text-highlighted">
        Keine Notifications
      </p>
      <p class="text-sm">
        Es wurden noch keine Jobs erstellt, die zu den Filtern passen.
      </p>
    </div>

    <!-- Liste -->
    <div
      v-else
      class="rounded-[--ui-radius] border border-default overflow-hidden"
    >
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-elevated border-b border-default">
            <th class="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
              Typ
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
              Status
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
              Empfänger
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
              Versuche
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider whitespace-nowrap">
              Erstellt
            </th>
            <th class="px-4 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">
              Aktion
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <template
            v-for="job in data.items"
            :key="job.id"
          >
            <tr
              class="hover:bg-elevated/50 transition-colors cursor-pointer"
              @click="toggleExpand(job.id)"
            >
              <td class="px-4 py-3 whitespace-nowrap">
                <UBadge
                  :label="typeLabels[job.type] ?? job.type"
                  color="neutral"
                  variant="subtle"
                  size="sm"
                />
              </td>
              <td class="px-4 py-3">
                <UBadge
                  :label="job.status"
                  :color="statusColor(job.status)"
                  variant="subtle"
                  size="sm"
                />
              </td>
              <td class="px-4 py-3 text-muted">
                {{ job.deliveryCount }}
              </td>
              <td class="px-4 py-3 text-muted">
                {{ job.attempts }}
              </td>
              <td class="px-4 py-3 text-muted whitespace-nowrap">
                {{ formatDateTime(job.createdAt) }}
              </td>
              <td class="px-4 py-3 text-right whitespace-nowrap">
                <UButton
                  v-if="job.status === 'failed'"
                  label="Retry"
                  icon="i-ph-arrow-counter-clockwise"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  :loading="retryLoading === job.id"
                  @click.stop="retry(job.id)"
                />
                <UIcon
                  :name="expandedJobId === job.id ? 'i-ph-caret-up' : 'i-ph-caret-down'"
                  class="size-4 inline text-muted ml-1"
                />
              </td>
            </tr>
            <tr v-if="expandedJobId === job.id">
              <td
                colspan="6"
                class="bg-elevated/30 px-4 py-4"
              >
                <div class="space-y-3">
                  <div v-if="job.error">
                    <p class="text-xs font-medium text-error uppercase tracking-wider">
                      Fehler
                    </p>
                    <p class="text-sm text-error mt-1 font-mono">
                      {{ job.error }}
                    </p>
                  </div>

                  <div>
                    <p class="text-xs font-medium text-muted uppercase tracking-wider">
                      Payload
                    </p>
                    <pre class="text-xs mt-1 font-mono text-dimmed whitespace-pre-wrap">{{ JSON.stringify(job.payload, null, 2) }}</pre>
                  </div>

                  <div v-if="job.deliveries.length > 0">
                    <p class="text-xs font-medium text-muted uppercase tracking-wider mb-2">
                      Deliveries
                    </p>
                    <div class="space-y-1">
                      <div
                        v-for="(d, idx) in job.deliveries"
                        :key="idx"
                        class="flex items-center gap-3 text-sm"
                      >
                        <UBadge
                          :label="d.channel"
                          color="neutral"
                          variant="soft"
                          size="xs"
                        />
                        <span class="text-highlighted">{{ d.recipientName }}</span>
                        <UBadge
                          :label="d.status"
                          :color="deliveryColor(d.status)"
                          variant="subtle"
                          size="xs"
                        />
                        <span
                          v-if="d.sentAt"
                          class="text-xs text-muted"
                        >{{ formatDateTime(d.sentAt) }}</span>
                        <span
                          v-if="d.error"
                          class="text-xs text-error truncate"
                        >{{ d.error }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div
      v-if="data && data.pagination.pages > 1"
      class="flex items-center justify-between mt-4"
    >
      <p class="text-xs text-muted">
        Seite {{ data.pagination.page }} von {{ data.pagination.pages }} · {{ data.pagination.total }} Einträge
      </p>
      <div class="flex gap-2">
        <UButton
          label="Zurück"
          color="neutral"
          variant="outline"
          size="sm"
          :disabled="page <= 1"
          @click="page = Math.max(1, page - 1)"
        />
        <UButton
          label="Weiter"
          color="neutral"
          variant="outline"
          size="sm"
          :disabled="page >= data.pagination.pages"
          @click="page = Math.min(data.pagination.pages, page + 1)"
        />
      </div>
    </div>
  </UContainer>
</template>
