<script setup lang="ts">
import type { EventDetail, EventPublicDetail, EventResponse } from '~~/shared/types/events'
import { generateEventOgDescription, isEventPublicDetail } from '~~/shared/utils/events'

const route = useRoute()
const toast = useToast()
const config = useRuntimeConfig()
const id = route.params.id as string

const { data: event, status, refresh } = useFetch<EventResponse>(`/api/events/${id}`, {
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

useSeoMeta({
  description: computed(() => event.value ? generateEventOgDescription(event.value) : undefined),
  ogTitle: computed(() => event.value?.name),
  ogDescription: computed(() => event.value ? generateEventOgDescription(event.value) : undefined),
  ogUrl: `${config.public.siteUrl}/events/${id}`,
  ogType: 'website',
})

defineOgImage('Default', { title: 'Events - Berlin Track Club' }, [
  { key: 'og', width: 1200, height: 630 },
  { key: 'whatsapp', width: 600, height: 600 },
])

const isInitialLoading = computed(() => status.value === 'pending' && !event.value)

const isCancelled = computed(() => !!event.value?.cancelledAt)
const isLadv = computed(() => event.value?.type === 'ladv')

const isPublic = computed(() => !!event.value && isEventPublicDetail(event.value))
const publicDetail = computed(() => isPublic.value ? event.value as EventPublicDetail : null)
const privateDetail = computed(() => !isPublic.value ? event.value as EventDetail : null)

const { session } = useUserSession()
const isAdmin = computed(() => session.value?.user?.role === 'admin' || session.value?.user?.role === 'superuser')
const isOwner = computed(() => !!session.value?.user?.id && privateDetail.value?.createdBy === session.value.user?.id)
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
      v-if="isInitialLoading"
      class="flex flex-col gap-8 lg:flex-row lg:gap-16"
    >
      <div class="flex-1 space-y-6">
        <div class="space-y-3">
          <USkeleton class="h-8 w-2/3" />
          <USkeleton class="h-4 w-1/3" />
        </div>
        <USkeleton class="h-32 w-full" />
        <USkeleton class="h-48 w-full" />
      </div>
      <div class="lg:w-72 xl:w-80 space-y-4">
        <USkeleton class="h-24 w-full" />
        <USkeleton class="h-16 w-full" />
      </div>
    </div>

    <div v-else-if="event">
      <!-- Header (inkl. LADV-Infos und Wettbewerbe): volle Breite -->
      <EventDetailHeader
        :event="event"
        class="mb-8 lg:mb-16"
      />

      <!-- Abgesagt-Alert -->
      <UAlert
        v-if="isCancelled"
        icon="i-ph-warning-circle"
        color="error"
        variant="subtle"
        title="Dieses Event wurde abgesagt"
        :description="`Abgesagt am ${formatDate(event.cancelledAt)}`"
        class="mb-8"
      />

      <!-- Two-Column Layout -->
      <div class="flex flex-col gap-8 lg:flex-row lg:gap-12 lg:items-start">
        <!-- Sidebar: order-1 auf Mobile (erscheint vor den Listen), lg:order-2 -->
        <aside class="order-1 lg:order-2 lg:w-72 xl:w-80 lg:shrink-0 lg:sticky lg:top-[calc(var(--ui-header-height)+2rem)] flex flex-col gap-8">
          <!-- Admin-Aktionen: auf Mobile zuerst, auf Desktop nach der Anmeldung -->
          <div
            v-if="canEdit"
            class="order-1 lg:order-2 space-y-3"
          >
            <p class="text-xs font-medium text-muted uppercase tracking-widest mb-3">
              Admin
            </p>
            <div
              v-if="isAdmin && isLadv"
              class="flex items-center justify-between gap-2 mb-3"
            >
              <span
                v-if="event.ladvLastSync"
                class="flex items-center gap-1 text-xs text-muted"
              >
                <UIcon
                  name="i-ph-arrows-clockwise"
                  class="size-3.5 shrink-0"
                />
                LADV-Sync: {{ formatDateTime(event.ladvLastSync) }}
              </span>
              <span
                v-else
                class="text-xs text-muted"
              >Noch nicht synchronisiert</span>
              <UButton
                icon="i-ph-arrows-clockwise"
                label="Sync"
                color="neutral"
                variant="outline"
                size="xs"
                :loading="syncLoading"
                @click="syncLadv"
              />
            </div>
            <div class="flex flex-col gap-2">
              <UButton
                :to="`/events/${id}/bearbeiten`"
                icon="i-ph-pencil-simple"
                label="Bearbeiten"
                color="neutral"
                variant="outline"
                size="sm"
                block
              />
              <UButton
                v-if="isAdmin && !isCancelled"
                icon="i-ph-x-circle"
                label="Event absagen"
                color="error"
                variant="outline"
                size="sm"
                block
                @click="cancelModal = true"
              />
              <UButton
                v-if="isAdmin && isCancelled"
                icon="i-ph-arrow-u-up-left"
                label="Reaktivieren"
                color="neutral"
                variant="outline"
                size="sm"
                block
                @click="uncancel"
              />
            </div>
          </div>

          <!-- Deine Anmeldung / Login-CTA: auf Mobile nach Admin, auf Desktop zuerst -->
          <div class="order-2 lg:order-1 bg-elevated border border-default rounded-[--ui-radius] p-5">
            <template v-if="isPublic">
              <p class="text-sm font-semibold text-highlighted mb-1">
                Anmeldung
              </p>
              <p class="text-sm text-muted mb-4">
                Melde dich an, um an diesem Event teilzunehmen.
              </p>
              <UButton
                :to="`/login?redirect=${encodeURIComponent(route.fullPath)}`"
                label="Jetzt einloggen"
                color="primary"
                block
              />
            </template>
            <EventRegisterForm
              v-else-if="privateDetail"
              :event="privateDetail"
              @refresh="refresh"
            />
          </div>
        </aside>

        <!-- Main: Info + Listen — order-2 auf Mobile, lg:order-1 -->
        <div class="order-2 lg:order-1 flex-1 min-w-0">
          <EventRegistrationList
            v-if="isPublic"
            :event-type="event.type"
            :public-mode="true"
            :registration-counts="publicDetail!.registrationCounts"
          />
          <EventRegistrationList
            v-else-if="privateDetail"
            :registrations="privateDetail.registrations"
            :event-type="event.type"
          />

          <div
            v-if="isAdmin && isLadv && privateDetail"
            class="mt-12"
          >
            <EventAdminLadvTodos
              :event="privateDetail"
              @refresh="refresh"
            />
          </div>
        </div>
      </div>
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
