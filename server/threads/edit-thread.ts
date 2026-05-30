import type { ThreadActor } from './actor'
import { ThreadError } from './errors'
import { findThreadById, updateThreadContent, type AppDb } from './persistence'
import { canEditThread } from './rules'

/** Maximale Titel-Länge (Zeichen, getrimmt) — serverseitiger Schutz. */
const MAX_TITLE_LENGTH = 200
/** Maximale Body-Länge (Zeichen, getrimmt) — serverseitiger Schutz. */
const MAX_BODY_LENGTH = 5000

export type EditThreadInput = {
  threadId: number
  title: string
  body: string
}

export type EditThreadDeps = {
  db: AppDb
}

/**
 * Editiert Titel und Body eines Beitrags. Nur Autor oder Admin; nicht bei
 * Event-Threads, nicht bei soft-gelöschten. Hebt `lastActivityAt` NICHT.
 */
export async function editThread(
  input: EditThreadInput,
  actor: ThreadActor,
  deps: EditThreadDeps,
): Promise<void> {
  const thread = await findThreadById(deps.db, input.threadId)
  if (!thread) throw new ThreadError('thread_not_found')

  if (!canEditThread(actor, thread)) {
    throw new ThreadError('forbidden')
  }

  if (
    input.title.trim().length > MAX_TITLE_LENGTH
    || input.body.trim().length > MAX_BODY_LENGTH
  ) {
    throw new ThreadError('thread_too_long')
  }

  await updateThreadContent(deps.db, input.threadId, {
    title: input.title,
    body: input.body,
  })
}
