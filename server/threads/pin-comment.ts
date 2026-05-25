import type { ThreadActor } from './actor'
import { ThreadError } from './errors'
import {
  countPinnedComments,
  findCommentById,
  findThreadById,
  setCommentPin,
  type AppDb,
} from './persistence'
import { canPinComment } from './rules'

export type PinCommentInput = {
  commentId: number
}

export type PinCommentDeps = {
  db: AppDb
}

/**
 * Heftet einen Kommentar an. Bei bereits angeheftetem Kommentar idempotent
 * (kein Re-Pin, `pinnedAt` bleibt). Limit von 3 angehefteten Kommentaren pro
 * Thread; darüber hinaus wirft `pin_limit_reached` (Predicate liefert false,
 * Operation übersetzt das in den spezifischen Code, damit das UI die Ursache
 * benennen kann).
 */
export async function pinComment(
  input: PinCommentInput,
  actor: ThreadActor,
  deps: PinCommentDeps,
): Promise<void> {
  const comment = await findCommentById(deps.db, input.commentId)
  if (!comment) throw new ThreadError('comment_not_found')

  const thread = await findThreadById(deps.db, comment.threadId)
  if (!thread) throw new ThreadError('thread_not_found')

  if (comment.pinnedAt !== null) return // schon angeheftet

  const pinnedCount = await countPinnedComments(deps.db, comment.threadId)

  if (!canPinComment(actor, thread, comment, pinnedCount)) {
    // Limit-Fall genauer benennen, damit das UI sagen kann „max. 3 erreicht".
    if (
      comment.deletedAt === null
      && (actor.kind === 'admin' || thread.createdBy === actor.userId)
      && pinnedCount >= 3
    ) {
      throw new ThreadError('pin_limit_reached')
    }
    throw new ThreadError('forbidden')
  }

  await setCommentPin(deps.db, input.commentId, { at: new Date(), by: actor.userId })
}

/**
 * Hebt das Anheften eines Kommentars wieder auf. Nur Admin oder Thread-Autor.
 * Idempotent — bei nicht angeheftetem Kommentar passiert nichts.
 */
export async function unpinComment(
  input: PinCommentInput,
  actor: ThreadActor,
  deps: PinCommentDeps,
): Promise<void> {
  const comment = await findCommentById(deps.db, input.commentId)
  if (!comment) throw new ThreadError('comment_not_found')

  const thread = await findThreadById(deps.db, comment.threadId)
  if (!thread) throw new ThreadError('thread_not_found')

  if (comment.pinnedAt === null) return // nichts zu tun

  if (!canPinComment(actor, thread, comment, 0)) {
    throw new ThreadError('forbidden')
  }

  await setCommentPin(deps.db, input.commentId, null)
}
