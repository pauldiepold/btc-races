import type { ThreadActor } from './actor'
import { ThreadError } from './errors'
import { findThreadById, softDeleteThread, type AppDb } from './persistence'
import { canDeleteThread } from './rules'

export type DeleteThreadInput = {
  threadId: number
}

export type DeleteThreadDeps = {
  db: AppDb
}

/**
 * Soft-Delete eines Beitrags. Setzt nur `deletedAt`; Body, Titel und Kommentare
 * bleiben. Hebt `lastActivityAt` NICHT.
 */
export async function deleteThread(
  input: DeleteThreadInput,
  actor: ThreadActor,
  deps: DeleteThreadDeps,
): Promise<void> {
  const thread = await findThreadById(deps.db, input.threadId)
  if (!thread) throw new ThreadError('thread_not_found')

  if (!canDeleteThread(actor, thread)) {
    throw new ThreadError('forbidden')
  }

  await softDeleteThread(deps.db, input.threadId, new Date())
}
