<script setup lang="ts">
import type { CommentWithAuthor, Thread } from '~~/shared/types/threads'

const props = defineProps<{ eventId: string }>()

const toast = useToast()
const { user } = useUserSession()

// Forum-Style: Eingabe oben, Kommentare neueste zuerst. Kein Auto-Scroll —
// die Event-Detailseite scrollt schon genug, ungewollter Sprung wäre störend.

const { data: thread, error: threadError } = await useFetch<Thread>(
  () => `/api/events/${props.eventId}/thread`,
)

const threadId = computed(() => thread.value?.id ?? null)

const { data: commentsAsc, refresh: refreshComments } = await useAsyncData<CommentWithAuthor[]>(
  () => `event-thread-comments-${threadId.value ?? 'none'}`,
  async () => {
    if (!threadId.value) return []
    return await $fetch<CommentWithAuthor[]>(`/api/threads/${threadId.value}/comments`)
  },
  { default: () => [], watch: [threadId] },
)

const comments = computed(() => [...(commentsAsc.value ?? [])].reverse())

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

const isAdmin = computed(() => user.value?.role === 'admin' || user.value?.role === 'superuser')

function canEditComment(c: CommentWithAuthor): boolean {
  if (c.deletedAt) return false
  return c.userId === user.value?.id
}

function canDeleteComment(c: CommentWithAuthor): boolean {
  if (c.deletedAt) return false
  return c.userId === user.value?.id || isAdmin.value
}

// ─── Pinning ──────────────────────────────────────────────────────────────────
// Admin oder Event-Autor (entspricht thread.createdBy für Event-Threads) darf
// pinnen. Max. 3 angeheftet, nicht bei gelöschtem Kommentar.
const pinnedComments = computed(() =>
  (commentsAsc.value ?? []).filter(c => c.pinnedAt && !c.deletedAt),
)

const pinningCommentId = ref<number | null>(null)

function canPinForThread(): boolean {
  const t = thread.value
  if (!t) return false
  return isAdmin.value || t.createdBy === user.value?.id
}

function canPinComment(c: CommentWithAuthor): boolean {
  if (c.deletedAt) return false
  if (!canPinForThread()) return false
  if (c.pinnedAt) return true
  return pinnedComments.value.length < 3
}

async function togglePin(c: CommentWithAuthor) {
  if (!canPinComment(c) || !threadId.value) return
  pinningCommentId.value = c.id
  try {
    await $fetch(`/api/threads/${threadId.value}/comments/${c.id}/pin`, {
      method: c.pinnedAt ? 'DELETE' : 'POST',
    })
    await refreshComments()
  }
  catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Ein Fehler ist aufgetreten.'
    toast.add({ title: 'Fehler', description: msg, color: 'error' })
  }
  finally {
    pinningCommentId.value = null
  }
}

function isEdited(c: CommentWithAuthor): boolean {
  if (c.deletedAt) return false
  return new Date(c.updatedAt).getTime() > new Date(c.createdAt).getTime()
}

const draft = ref('')
const inputMode = ref<'write' | 'preview'>('write')
const sending = ref(false)

const inputTabs = [
  { value: 'write', label: 'Schreiben' },
  { value: 'preview', label: 'Vorschau' },
]

const canSend = computed(() => draft.value.trim().length > 0 && !sending.value && threadId.value !== null)

async function onSend() {
  if (!canSend.value || !threadId.value) return
  sending.value = true
  try {
    await $fetch(`/api/threads/${threadId.value}/comments`, {
      method: 'POST',
      body: { body: draft.value.trim() },
    })
    draft.value = ''
    inputMode.value = 'write'
    await refreshComments()
  }
  catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Ein Fehler ist aufgetreten.'
    toast.add({ title: 'Fehler', description: msg, color: 'error' })
  }
  finally {
    sending.value = false
  }
}

const editingCommentId = ref<number | null>(null)
const commentEditDraft = ref('')
const savingComment = ref(false)

function startEditComment(c: CommentWithAuthor) {
  editingCommentId.value = c.id
  commentEditDraft.value = c.body
}

function cancelEditComment() {
  editingCommentId.value = null
  commentEditDraft.value = ''
}

async function saveCommentEdit(commentId: number) {
  if (!threadId.value) return
  const body = commentEditDraft.value.trim()
  if (!body) {
    toast.add({ title: 'Fehler', description: 'Kommentar darf nicht leer sein.', color: 'error' })
    return
  }
  savingComment.value = true
  try {
    await $fetch(`/api/threads/${threadId.value}/comments/${commentId}`, {
      method: 'PATCH',
      body: { body },
    })
    await refreshComments()
    editingCommentId.value = null
    commentEditDraft.value = ''
  }
  catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Ein Fehler ist aufgetreten.'
    toast.add({ title: 'Fehler', description: msg, color: 'error' })
  }
  finally {
    savingComment.value = false
  }
}

async function deleteCommentAction(commentId: number) {
  if (!threadId.value) return
  if (!confirm('Diesen Kommentar wirklich löschen?')) return
  try {
    await $fetch(`/api/threads/${threadId.value}/comments/${commentId}`, {
      method: 'DELETE',
    })
    await refreshComments()
  }
  catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Ein Fehler ist aufgetreten.'
    toast.add({ title: 'Fehler', description: msg, color: 'error' })
  }
}
</script>

<template>
  <!-- eslint-disable vue/no-v-html -- sanitisierter renderMarkdown-Output -->
  <section
    v-if="!threadError"
    class="mt-12"
  >
    <h2 class="font-display font-semibold text-highlighted text-lg mb-4">
      Kommentare
    </h2>

    <div class="rounded-[--ui-radius] border border-default bg-elevated">
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

    <!-- Wichtig-Block: angeheftete Kommentare zusätzlich oberhalb des Streams -->
    <section
      v-if="pinnedComments.length > 0"
      class="mt-6 rounded-[--ui-radius] border border-primary/30 bg-primary/5 p-3"
    >
      <div class="flex items-center gap-1.5 mb-2 text-xs font-medium text-primary">
        <UIcon
          name="i-ph-push-pin-fill"
          class="size-3.5"
        />
        Wichtig
      </div>
      <ul class="space-y-3">
        <li
          v-for="pinned in pinnedComments"
          :key="`pinned-${pinned.id}`"
          class="text-sm"
        >
          <div class="flex items-baseline gap-2 mb-1">
            <span class="text-xs font-medium text-default">
              {{ pinned.authorName ?? 'Unbekannt' }}
            </span>
            <span class="text-xs text-muted">
              {{ relativeTime(pinned.createdAt) }}
            </span>
          </div>
          <div
            class="md-body"
            v-html="renderMarkdown(pinned.body)"
          />
        </li>
      </ul>
    </section>

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
      class="space-y-4 mt-6"
    >
      <li
        v-for="comment in comments"
        :key="comment.id"
        class="group flex flex-col"
        :class="comment.userId === user?.id ? 'items-end' : 'items-start'"
      >
        <div class="flex items-baseline gap-2 mb-1 px-1">
          <span class="text-xs font-medium text-default">
            {{ comment.authorName ?? 'Unbekannt' }}
          </span>
          <span class="text-xs text-muted">
            {{ relativeTime(comment.createdAt) }}
          </span>
          <span
            v-if="isEdited(comment)"
            class="text-xs text-dimmed italic"
          >
            (bearbeitet)
          </span>
        </div>

        <div
          v-if="comment.deletedAt"
          class="text-xs italic text-dimmed rounded-[--ui-radius] px-3.5 py-2.5 bg-elevated/50 border border-dashed border-default max-w-[85%]"
        >
          Kommentar gelöscht
        </div>

        <div
          v-else-if="editingCommentId === comment.id"
          class="w-full max-w-[85%] space-y-2"
        >
          <UTextarea
            v-model="commentEditDraft"
            :rows="3"
            autoresize
            :maxrows="10"
            class="w-full"
          />
          <div class="flex justify-end gap-2">
            <UButton
              label="Abbrechen"
              size="xs"
              color="neutral"
              variant="ghost"
              :disabled="savingComment"
              @click="cancelEditComment"
            />
            <UButton
              label="Speichern"
              size="xs"
              color="primary"
              :loading="savingComment"
              @click="saveCommentEdit(comment.id)"
            />
          </div>
        </div>

        <div
          v-else
          class="relative max-w-[85%]"
        >
          <div
            class="md-body text-sm rounded-[--ui-radius] px-3.5 py-2.5"
            :class="comment.userId === user?.id
              ? 'bg-primary/15 text-default'
              : 'bg-elevated text-default'"
            v-html="renderMarkdown(comment.body)"
          />
          <div
            v-if="canEditComment(comment) || canDeleteComment(comment) || canPinComment(comment)"
            class="absolute -top-3 right-2 hidden gap-0.5 rounded-[--ui-radius] border border-default bg-elevated shadow-sm group-hover:flex"
          >
            <UButton
              v-if="canPinComment(comment)"
              :icon="comment.pinnedAt ? 'i-ph-push-pin-slash' : 'i-ph-push-pin'"
              size="xs"
              variant="ghost"
              color="neutral"
              :loading="pinningCommentId === comment.id"
              :aria-label="comment.pinnedAt ? 'Kommentar abheften' : 'Kommentar anheften'"
              @click="togglePin(comment)"
            />
            <UButton
              v-if="canEditComment(comment)"
              icon="i-ph-pencil-simple"
              size="xs"
              variant="ghost"
              color="neutral"
              aria-label="Kommentar editieren"
              @click="startEditComment(comment)"
            />
            <UButton
              v-if="canDeleteComment(comment)"
              icon="i-ph-trash"
              size="xs"
              variant="ghost"
              color="neutral"
              aria-label="Kommentar löschen"
              @click="deleteCommentAction(comment.id)"
            />
          </div>
          <UIcon
            v-if="comment.pinnedAt"
            name="i-ph-push-pin-fill"
            class="absolute -top-1.5 -left-1.5 size-3.5 text-primary"
            aria-label="Angeheftet"
          />
        </div>
      </li>
    </ul>
  </section>
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
