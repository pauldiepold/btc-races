import type { MaybeRefOrGetter, Ref } from 'vue'
import type { CommentWithAuthor } from '~~/shared/types/threads'
import { commentCursor, mergeComments } from '~~/shared/utils/comment-polling'

/**
 * Live-Aktualisierung der Kommentare per Polling. Holt im Intervall (~30 s) nur
 * die seit dem letzten Stand neuen Kommentare (`since`-Delta) und merged sie in
 * den übergebenen Ref. Pausiert bei unsichtbarem Tab (Page-Visibility-API) und
 * nimmt bei Rückkehr sofort wieder auf.
 *
 * Mutiert nur `comments` — bewusst **kein** Auto-Scroll: das bleibt Mount und
 * eigenem Senden vorbehalten.
 */
export function usePolledComments(
  threadId: MaybeRefOrGetter<number | string | null>,
  comments: Ref<CommentWithAuthor[]>,
  options: { intervalMs?: number } = {},
) {
  const intervalMs = options.intervalMs ?? 30_000
  let timer: ReturnType<typeof setInterval> | null = null

  async function poll() {
    const id = toValue(threadId)
    if (id == null || document.hidden) return
    try {
      const fresh = await $fetch<CommentWithAuthor[]>(`/api/threads/${id}/comments`, {
        query: { since: commentCursor(comments.value ?? [])?.toISOString() },
      })
      if (fresh.length) comments.value = mergeComments(comments.value ?? [], fresh)
    }
    catch {
      // Polling ist best-effort — Fehler still verschlucken, nächster Tick versucht es erneut.
    }
  }

  function start() {
    if (timer) return
    timer = setInterval(poll, intervalMs)
  }

  function stop() {
    if (!timer) return
    clearInterval(timer)
    timer = null
  }

  function onVisibilityChange() {
    if (document.hidden) {
      stop()
    }
    else {
      poll()
      start()
    }
  }

  onMounted(() => {
    if (!document.hidden) start()
    document.addEventListener('visibilitychange', onVisibilityChange)
  })

  onUnmounted(() => {
    stop()
    document.removeEventListener('visibilitychange', onVisibilityChange)
  })
}
