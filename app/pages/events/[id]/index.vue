<script setup lang="ts">
import type { EventDetail } from '~~/shared/types/events'

const route = useRoute()
const toast = useToast()
const id = route.params.id as string

const { data: event, status, refresh } = await useFetch<EventDetail>(`/api/events/${id}`, {
  onResponseError({ response }) {
    if (response.status === 404) {
      toast.add({ title: 'Event nicht gefunden', color: 'error' })
      navigateTo('/')
    }
  },
})

useHead(() => ({
  title: event.value?.name ?? 'Event',
}))

const isCancelled = computed(() => !!event.value?.cancelledAt)
const isLadv = computed(() => event.value?.type === 'ladv')

const { session } = useUserSession()
const isAdmin = computed(() => session.value?.user?.role === 'admin' || session.value?.user?.role === 'superuser')
const isOwner = computed(() => !!session.value?.user?.id && event.value?.createdBy === session.value.user?.id)
const canEdit = computed(() => isAdmin.value || isOwner.value)

// Cancel / Uncancel
const cancelModal = ref(false)
const cancelLoading = ref(false)

async function confirmCancel() {
  if (!event.value) return
  cancelLoading.value = true
  try {
    await $fetch(`/api/events/${id}/cancel`, { method: 'POST' })
    toast.add({ title: 'Event abgesagt', color: 'success' })
    cancelModal.value = false
    await refresh()
  }
  catch {
    toast.add({ title: 'Fehler beim Absagen', color: 'error' })
  }
  finally {
    cancelLoading.value = false
  }
}

async function uncancel() {
  try {
    await $fetch(`/api/events/${id}/uncancel`, { method: 'POST' })
    toast.add({ title: 'Absage rückgängig gemacht', color: 'success' })
    await refresh()
  }
  catch {
    toast.add({ title: 'Fehler', color: 'error' })
  }
}

// LADV Sync
const syncLoading = ref(false)

async function syncLadv() {
  if (!event.value) return
  syncLoading.value = true
  try {
    const updated = await $fetch<EventDetail>(`/api/events/${id}/sync`, { method: 'POST' })
    toast.add({ title: 'LADV-Daten aktualisiert', color: 'success' })
    await refresh()

    if (updated.ladvData) {
      const { detectLadvDiff } = await import('~~/shared/utils/ladv')
      const diff = detectLadvDiff(updated, updated.ladvData)
      const diffCount = Object.keys(diff).length
      if (diffCount > 0) {
        toast.add({
          title: `${diffCount} Feld${diffCount > 1 ? 'er weichen' : ' weicht'} von LADV ab`,
          description: 'Im Bearbeitungsformular übernehmen',
          color: 'warning',
          actions: [{ label: 'Bearbeiten', onClick: () => { navigateTo(`/events/${id}/bearbeiten`) } }],
        })
      }
    }
  }
  catch (err: unknown) {
    const status = (err as { status?: number }).status
    if (status === 502) {
      toast.add({ title: 'LADV nicht erreichbar', description: 'Bitte später erneut versuchen.', color: 'error' })
    }
    else {
      toast.add({ title: 'Sync fehlgeschlagen', color: 'error' })
    }
  }
  finally {
    syncLoading.value = false
  }
}
</script>

<template>
  <UContainer class="py-10 lg:py-14">
    <UButton
      to="/"
      icon="i-ph-arrow-left"
      label="Alle Events"
      color="neutral"
      variant="ghost"
      size="sm"
      class="mb-6"
    />

    <!-- Lade-Zustand -->
    <div
      v-if="status === 'pending'"
      class="flex flex-col gap-14 lg:flex-row lg:gap-16"
    >
      <div class="flex-1 space-y-6">
        <div class="space-y-3">
          <USkeleton class="h-8 w-2/3" />
          <USkeleton class="h-4 w-1/3" />
        </div>
        <USkeleton class="h-32 w-full" />
        <USkeleton class="h-48 w-full" />
      </div>
      <div class="lg:w-64 xl:w-72 space-y-4">
        <USkeleton class="h-24 w-full" />
        <USkeleton class="h-16 w-full" />
      </div>
    </div>

    <div
      v-else-if="event"
      class="flex flex-col gap-14 lg:flex-row lg:gap-16 lg:items-start"
    >
      <!-- Hauptinhalt -->
      <div class="flex-1 min-w-0 space-y-8">
        <!-- Header + Admin-Aktionen -->
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <EventHeader
            :event="event"
            class="flex-1 min-w-0"
          />

          <div
            v-if="canEdit"
            class="flex items-center gap-2 shrink-0"
          >
            <UButton
              v-if="canEdit"
              :to="`/events/${id}/bearbeiten`"
              icon="i-ph-pencil-simple"
              label="Bearbeiten"
              color="neutral"
              variant="outline"
              size="sm"
            />

            <UButton
              v-if="isAdmin && isLadv"
              icon="i-ph-arrows-clockwise"
              label="Sync"
              color="neutral"
              variant="outline"
              size="sm"
              :loading="syncLoading"
              @click="syncLadv"
            />

            <UButton
              v-if="isAdmin && !isCancelled"
              icon="i-ph-x-circle"
              label="Absagen"
              color="error"
              variant="outline"
              size="sm"
              @click="cancelModal = true"
            />

            <UButton
              v-if="isAdmin && isCancelled"
              icon="i-ph-arrow-u-up-left"
              label="Reaktivieren"
              color="neutral"
              variant="outline"
              size="sm"
              @click="uncancel"
            />
          </div>
        </div>

        <UAlert
          v-if="isCancelled"
          icon="i-ph-warning-circle"
          color="error"
          variant="subtle"
          title="Dieses Event wurde abgesagt"
          :description="`Abgesagt am ${formatDate(event.cancelledAt)}`"
        />

        <EventLadvInfo
          v-if="isLadv && event.ladvData"
          :data="event.ladvData"
          :last-sync="event.ladvLastSync"
        />

        <EventRegisterForm :event="event" />

        <EventRegistrationList
          :registrations="event.registrations"
          :event-type="event.type"
        />

        <EventComments :event-id="event.id" />
      </div>

      <!-- Sidebar -->
      <aside class="lg:w-64 xl:w-72 lg:shrink-0 lg:sticky lg:top-[calc(var(--ui-header-height)+2rem)] space-y-4">
        <div
          v-if="event.announcementLink"
          class="pb-5 border-b border-default"
        >
          <p class="text-xs font-medium text-muted uppercase tracking-widest mb-3">
            Ausschreibung
          </p>
          <UButton
            :to="event.announcementLink"
            target="_blank"
            rel="noopener noreferrer"
            color="neutral"
            variant="outline"
            trailing-icon="i-ph-arrow-up-right-bold"
            block
          >
            Ausschreibung öffnen
          </UButton>
        </div>

        <div>
          <p class="text-xs font-medium text-muted uppercase tracking-widest mb-3">
            Fragen?
          </p>
          <p class="text-sm text-muted mb-3 leading-relaxed">
            Bei Fragen zum Event wende dich über die BTC Community an die Coaches.
          </p>
          <UButton
            to="https://app.campai.com/pt/9a0cd/rooms/room/688357998a5abe1409d4fc8e/channel"
            target="_blank"
            rel="noopener noreferrer"
            color="neutral"
            variant="outline"
            size="sm"
            trailing-icon="i-ph-arrow-up-right-bold"
            block
          >
            BTC Community
          </UButton>
        </div>
      </aside>
    </div>

    <!-- Absagen-Bestätigungsdialog -->
    <UModal v-model:open="cancelModal">
      <template #content>
        <div class="p-6 space-y-4">
          <div class="flex items-start gap-3">
            <UIcon
              name="i-ph-warning-circle"
              class="size-5 text-error shrink-0 mt-0.5"
            />
            <div>
              <p class="font-semibold text-highlighted">
                Event absagen?
              </p>
              <p class="text-sm text-muted mt-1">
                Das Event wird als abgesagt markiert. Bestehende Anmeldungen bleiben erhalten. Die Absage kann rückgängig gemacht werden.
              </p>
            </div>
          </div>
          <div class="flex justify-end gap-2">
            <UButton
              label="Abbrechen"
              color="neutral"
              variant="ghost"
              @click="cancelModal = false"
            />
            <UButton
              label="Ja, absagen"
              color="error"
              :loading="cancelLoading"
              @click="confirmCancel"
            />
          </div>
        </div>
      </template>
    </UModal>
  </UContainer>
</template>
