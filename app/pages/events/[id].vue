<script setup lang="ts">
import type { EventDetail } from '~~/shared/types/events'

const route = useRoute()
const toast = useToast()
const id = route.params.id as string

const { data: event, status } = await useFetch<EventDetail>(`/api/events/${id}`, {
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
        <EventHeader :event="event" />

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
  </UContainer>
</template>
