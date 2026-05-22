<script setup lang="ts">
import type { Thread, CommentWithAuthor } from '~~/shared/types/threads'

definePageMeta({ title: 'Beitrag' })

const route = useRoute()
const toast = useToast()
const { user } = useUserSession()
const threadId = computed(() => route.params.id as string)

// ─── Räume (nur UI-Beschriftung) ──────────────────────────────────────────────
const ROOM_LABELS: Record<string, string> = {
  announcements: 'Ankündigungen',
  training: 'Training',
  team: 'Team',
  races: 'Races',
  social: 'Social',
}

// ─── Daten ────────────────────────────────────────────────────────────────────
// Bewusst nur beim Mount und nach eigenem Senden geladen — kein Polling.
const { data: thread, error: threadError } = await useFetch<Thread>(
  () => `/api/threads/${threadId.value}`,
)

const { data: comments, refresh: refreshComments } = await useFetch<CommentWithAuthor[]>(
  () => `/api/threads/${threadId.value}/comments`,
  { default: () => [] },
)

useHead({ title: () => `${thread.value?.title ?? 'Beitrag'} | Berlin Track Club` })

// ─── Zeitformat ───────────────────────────────────────────────────────────────
const rtf = new Intl.RelativeTimeFormat('de', { numeric: 'auto' })

function relativeTime(value: Date | string): string {
  const sec = Math.round((new Date(value).getTime() - Date.now()) / 1000)
  const abs = Math.abs(sec)
  if (abs < 60) return rtf.format(sec, 'second')
  if (abs < 3600) return rtf.format(Math.round(sec / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(sec / 3600), 'hour')
  if (abs < 2592000) return rtf.format(Math.round(sec / 86400), 'day')
  if (abs < 31536000) return rtf.format(Math.round(sec / 2592000), 'month')
  return rtf.format(Math.round(sec / 31536000), 'year')
}

// ─── Auto-Scroll ──────────────────────────────────────────────────────────────
// Beim Öffnen und nach eigenem Senden ans Ende — nicht bei sonstigen Updates.
function scrollToEnd(behavior: ScrollBehavior = 'auto') {
  if (import.meta.client) {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior })
  }
}

onMounted(async () => {
  await nextTick()
  scrollToEnd()
})

// ─── Kommentar schreiben ──────────────────────────────────────────────────────
const draft = ref('')
const inputMode = ref<'write' | 'preview'>('write')
const sending = ref(false)

const inputTabs = [
  { value: 'write', label: 'Schreiben' },
  { value: 'preview', label: 'Vorschau' },
]

const canSend = computed(() => draft.value.trim().length > 0 && !sending.value)

async function onSend() {
  if (!canSend.value) return
  sending.value = true
  try {
    await $fetch(`/api/threads/${threadId.value}/comments`, {
      method: 'POST',
      body: { body: draft.value.trim() },
    })
    draft.value = ''
    inputMode.value = 'write'
    await refreshComments()
    await nextTick()
    scrollToEnd('smooth')
  }
  catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Ein Fehler ist aufgetreten.'
    toast.add({ title: 'Fehler', description: msg, color: 'error' })
  }
  finally {
    sending.value = false
  }
}
</script>

<template>
  <!-- eslint-disable vue/no-v-html -- jedes v-html unten ist sanitisierter renderMarkdown-Output -->
  <UContainer class="max-w-3xl py-8 lg:py-10">
    <ULink
      to="/beitraege"
      class="inline-flex items-center gap-1 text-sm text-muted hover:text-default mb-6"
    >
      <UIcon
        name="i-ph-arrow-left"
        class="size-4"
      />
      Beiträge
    </ULink>

    <div
      v-if="threadError || !thread"
      class="text-center py-16 text-muted"
    >
      <UIcon
        name="i-ph-warning-circle"
        class="size-10 mb-3 text-dimmed"
      />
      <p class="text-sm">
        Dieser Beitrag wurde nicht gefunden.
      </p>
    </div>

    <template v-else>
      <!-- Eröffnung -->
      <article class="rounded-[--ui-radius] border border-default bg-elevated/40 p-5 mb-8">
        <div class="flex items-center gap-2 mb-2">
          <UBadge
            :label="ROOM_LABELS[thread.roomSlug] ?? thread.roomSlug"
            color="neutral"
            variant="subtle"
            size="sm"
          />
          <span class="text-xs text-muted">
            {{ relativeTime(thread.createdAt) }}
          </span>
        </div>
        <h1 class="text-xl font-bold tracking-tight text-highlighted mb-3">
          {{ thread.title }}
        </h1>
        <div
          class="md-body text-sm text-default"
          v-html="renderMarkdown(thread.body ?? '')"
        />
      </article>

      <!-- Kommentare -->
      <div
        v-if="comments.length === 0"
        class="text-center py-10 text-muted"
      >
        <p class="text-sm">
          Noch keine Kommentare — schreib den ersten.
        </p>
      </div>

      <ul
        v-else
        class="space-y-4"
      >
        <li
          v-for="comment in comments"
          :key="comment.id"
          class="flex flex-col"
          :class="comment.userId === user?.id ? 'items-end' : 'items-start'"
        >
          <div class="flex items-baseline gap-2 mb-1 px-1">
            <span class="text-xs font-medium text-default">
              {{ comment.authorName ?? 'Unbekannt' }}
            </span>
            <span class="text-xs text-muted">
              {{ relativeTime(comment.createdAt) }}
            </span>
          </div>
          <div
            class="md-body text-sm rounded-[--ui-radius] px-3.5 py-2.5 max-w-[85%]"
            :class="comment.userId === user?.id
              ? 'bg-primary/15 text-default'
              : 'bg-elevated text-default'"
            v-html="renderMarkdown(comment.body)"
          />
        </li>
      </ul>

      <!-- Sticky Eingabe -->
      <div class="sticky bottom-4 z-10 mt-6 rounded-[--ui-radius] border border-default bg-elevated shadow-lg">
        <div class="flex items-center justify-between gap-2 border-b border-default px-3 py-1.5">
          <UTabs
            v-model="inputMode"
            :items="inputTabs"
            :content="false"
            size="xs"
            color="primary"
          />
          <span class="text-xs text-dimmed pr-1">
            Markdown
          </span>
        </div>

        <div class="p-3">
          <UTextarea
            v-show="inputMode === 'write'"
            v-model="draft"
            :rows="3"
            autoresize
            :maxrows="10"
            placeholder="Schreib einen Kommentar …"
            class="w-full"
            @keydown.enter.meta.prevent="onSend"
            @keydown.enter.ctrl.prevent="onSend"
          />
          <div
            v-show="inputMode === 'preview'"
            class="md-body text-sm min-h-[5rem] rounded-[--ui-radius] bg-default/50 px-3 py-2"
          >
            <p
              v-if="!draft.trim()"
              class="text-muted"
            >
              Nichts zum Vorschauen.
            </p>
            <div
              v-else
              v-html="renderMarkdown(draft)"
            />
          </div>

          <div class="flex justify-end mt-2">
            <UButton
              label="Senden"
              icon="i-ph-paper-plane-right"
              color="primary"
              :loading="sending"
              :disabled="!canSend"
              @click="onSend"
            />
          </div>
        </div>
      </div>
    </template>
  </UContainer>
</template>

<style scoped>
.md-body :deep(p) {
  margin: 0.25rem 0;
}
.md-body :deep(p:first-child) {
  margin-top: 0;
}
.md-body :deep(p:last-child) {
  margin-bottom: 0;
}
.md-body :deep(ul),
.md-body :deep(ol) {
  margin: 0.25rem 0;
  padding-left: 1.25rem;
  list-style: revert;
}
.md-body :deep(a) {
  color: var(--ui-primary);
  text-decoration: underline;
}
.md-body :deep(code) {
  font-size: 0.85em;
  padding: 0.1rem 0.3rem;
  border-radius: 0.25rem;
  background: var(--ui-bg-accented);
}
.md-body :deep(pre) {
  margin: 0.4rem 0;
  padding: 0.6rem 0.8rem;
  border-radius: var(--ui-radius);
  background: var(--ui-bg-accented);
  overflow-x: auto;
}
.md-body :deep(pre code) {
  padding: 0;
  background: transparent;
}
</style>
