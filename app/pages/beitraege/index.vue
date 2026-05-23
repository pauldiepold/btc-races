<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { RoomSlug, ThreadListItem } from '~~/shared/types/threads'

definePageMeta({ title: 'Beiträge' })

useHead({ title: 'Beiträge | Berlin Track Club' })

const toast = useToast()
const { session } = useUserSession()
const isAdmin = computed(() => {
  const role = session.value?.user?.role
  return role === 'admin' || role === 'superuser'
})

// ─── Räume ──────────────────────────────────────────────────────────────────
// Autorität für Anlage-Rechte ist server/threads/rooms.ts; diese Liste ist nur
// UI (Tab-Beschriftung, Vorauswahl). Der Server lehnt unerlaubte Räume ab.
const ROOMS = [
  { value: 'announcements', label: 'Ankündigungen', adminOnly: true },
  { value: 'training', label: 'Training', adminOnly: false },
  { value: 'team', label: 'Team', adminOnly: false },
  { value: 'races', label: 'Races', adminOnly: false },
  { value: 'social', label: 'Social', adminOnly: false },
] as const

const tabs = [
  { value: 'all', label: 'Alle' },
  ...ROOMS.map(r => ({ value: r.value, label: r.label })),
]

const creatableRooms = computed(() =>
  ROOMS.filter(r => !r.adminOnly || isAdmin.value),
)

// Jedes Mitglied darf in mindestens einem Raum anlegen → Button immer sichtbar.
const canCreate = computed(() => creatableRooms.value.length > 0)

// ─── Liste ──────────────────────────────────────────────────────────────────
const activeRoom = ref<string>('all')

const { data: threads, status, refresh } = await useFetch<ThreadListItem[]>('/api/threads', {
  query: computed(() => ({
    room: activeRoom.value === 'all' ? undefined : activeRoom.value,
  })),
})

const rtf = new Intl.RelativeTimeFormat('de', { numeric: 'auto' })

function relativeTime(value: Date | string): string {
  const ms = new Date(value).getTime() - Date.now()
  const sec = Math.round(ms / 1000)
  const abs = Math.abs(sec)
  if (abs < 60) return rtf.format(sec, 'second')
  if (abs < 3600) return rtf.format(Math.round(sec / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(sec / 3600), 'hour')
  if (abs < 2592000) return rtf.format(Math.round(sec / 86400), 'day')
  if (abs < 31536000) return rtf.format(Math.round(sec / 2592000), 'month')
  return rtf.format(Math.round(sec / 31536000), 'year')
}

function excerpt(body: string | null): string {
  if (!body) return ''
  const text = body.trim()
  return text.length > 160 ? `${text.slice(0, 160)}…` : text
}

function roomLabel(slug: string): string {
  return ROOMS.find(r => r.value === slug)?.label ?? slug
}

// ─── Anlage ─────────────────────────────────────────────────────────────────
const createOpen = ref(false)
const submitting = ref(false)

const schema = z.object({
  roomSlug: z.enum(['announcements', 'training', 'team', 'races', 'social']),
  title: z.string().trim().min(1, 'Titel ist erforderlich').max(200, 'Titel ist zu lang'),
  body: z.string().trim().min(1, 'Text ist erforderlich').max(5000, 'Text ist zu lang'),
})
type Schema = z.output<typeof schema>

const state = reactive<{ roomSlug: RoomSlug, title: string, body: string }>({
  roomSlug: creatableRooms.value[0]?.value ?? 'training',
  title: '',
  body: '',
})

function openCreate() {
  const preselect = creatableRooms.value.find(r => r.value === activeRoom.value)
  state.roomSlug = preselect?.value ?? creatableRooms.value[0]?.value ?? 'training'
  state.title = ''
  state.body = ''
  createOpen.value = true
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  submitting.value = true
  try {
    await $fetch('/api/threads', { method: 'POST', body: event.data })
    toast.add({ title: 'Beitrag angelegt', color: 'success' })
    createOpen.value = false
    activeRoom.value = event.data.roomSlug
    await refresh()
  }
  catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Ein Fehler ist aufgetreten.'
    toast.add({ title: 'Fehler', description: msg, color: 'error' })
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <UContainer class="py-10 lg:py-14 max-w-3xl">
    <div class="flex items-start justify-between gap-4 mb-8">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-highlighted">
          Beiträge
        </h1>
        <p class="text-sm text-muted mt-1">
          Vereinsinterne Diskussionen, gegliedert nach Räumen.
        </p>
      </div>
      <UButton
        v-if="canCreate"
        icon="i-ph-plus-bold"
        label="Neuer Beitrag"
        color="primary"
        @click="openCreate"
      />
    </div>

    <UTabs
      v-model="activeRoom"
      :items="tabs"
      :content="false"
      color="primary"
      class="mb-6"
    />

    <div
      v-if="status === 'pending'"
      class="space-y-3"
    >
      <USkeleton
        v-for="n in 3"
        :key="n"
        class="h-20 w-full"
      />
    </div>

    <div
      v-else-if="!threads || threads.length === 0"
      class="text-center py-16 text-muted"
    >
      <UIcon
        name="i-ph-chats-circle"
        class="size-10 mb-3 text-dimmed"
      />
      <p class="text-sm">
        Noch keine Beiträge in diesem Raum.
      </p>
    </div>

    <ul
      v-else
      class="space-y-3"
    >
      <li
        v-for="thread in threads"
        :key="thread.id"
      >
        <NuxtLink
          :to="thread.event ? `/${thread.event.id}` : `/beitraege/${thread.id}`"
          class="block rounded-[--ui-radius] border border-default bg-elevated/40 p-4 transition hover:bg-elevated/70"
        >
          <div class="flex items-center gap-2 mb-1">
            <UBadge
              :label="roomLabel(thread.roomSlug)"
              color="neutral"
              variant="subtle"
              size="sm"
            />
            <UBadge
              v-if="thread.event"
              label="Event"
              color="primary"
              variant="subtle"
              size="sm"
              icon="i-ph-calendar-blank"
            />
            <span class="text-xs text-muted">
              {{ relativeTime(thread.lastActivityAt) }}
            </span>
            <span class="text-xs text-muted inline-flex items-center gap-1 ml-auto">
              <UIcon
                name="i-ph-chat-circle"
                class="size-3.5"
              />
              {{ thread.commentCount }}
            </span>
          </div>
          <p class="font-semibold text-highlighted">
            {{ thread.event ? thread.event.name : thread.title }}
          </p>
          <p
            v-if="thread.event"
            class="text-sm text-muted mt-1 inline-flex items-center gap-3 flex-wrap"
          >
            <span
              v-if="thread.event.date"
              class="inline-flex items-center gap-1"
            >
              <UIcon
                name="i-ph-calendar-blank"
                class="size-3.5"
              />
              {{ formatDate(thread.event.date) }}
            </span>
            <span
              v-if="thread.event.location"
              class="inline-flex items-center gap-1"
            >
              <UIcon
                name="i-ph-map-pin"
                class="size-3.5"
              />
              {{ thread.event.location }}
            </span>
          </p>
          <p
            v-else-if="excerpt(thread.body)"
            class="text-sm text-muted mt-1 line-clamp-2"
          >
            {{ excerpt(thread.body) }}
          </p>
        </NuxtLink>
      </li>
    </ul>

    <UModal
      v-model:open="createOpen"
      :ui="{ content: 'sm:max-w-lg' }"
    >
      <template #header>
        <p class="text-base font-semibold text-highlighted">
          Neuer Beitrag
        </p>
      </template>

      <template #body>
        <UForm
          id="create-thread-form"
          :schema="schema"
          :state="state"
          class="space-y-5"
          @submit="onSubmit"
        >
          <UFormField
            name="roomSlug"
            label="Raum"
            required
          >
            <USelect
              v-model="state.roomSlug"
              :items="creatableRooms"
              value-key="value"
              label-key="label"
              class="w-full"
            />
          </UFormField>

          <UFormField
            name="title"
            label="Titel"
            required
          >
            <UInput
              v-model="state.title"
              placeholder="Worum geht es?"
              class="w-full"
            />
          </UFormField>

          <UFormField
            name="body"
            label="Text"
            description="Markdown wird unterstützt."
            required
          >
            <UTextarea
              v-model="state.body"
              :rows="6"
              placeholder="Schreib deinen Beitrag …"
              class="w-full"
            />
          </UFormField>
        </UForm>
      </template>

      <template #footer>
        <div class="flex gap-2 ml-auto">
          <UButton
            label="Abbrechen"
            color="neutral"
            variant="ghost"
            @click="createOpen = false"
          />
          <UButton
            type="submit"
            form="create-thread-form"
            label="Veröffentlichen"
            color="primary"
            :loading="submitting"
            :disabled="submitting"
          />
        </div>
      </template>
    </UModal>
  </UContainer>
</template>
