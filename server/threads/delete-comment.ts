import type { ThreadActor } from './actor'
import { ThreadError } from './errors'
import { findCommentById, softDeleteComment, type AppDb } from './persistence'
import { canDeleteComment } from './rules'

export type DeleteCommentInput = {
  commentId: number
}

export type DeleteCommentDeps = {
  db: AppDb
}

/**
 * Soft-Delete eines Kommentars. Body bleibt in der DB — den Tombstone
 * „Kommentar gelöscht" rendert das UI. Hebt `lastActivityAt` NICHT.
 */
export async function deleteComment(
  input: DeleteCommentInput,
  actor: ThreadActor,
  deps: DeleteCommentDeps,
): Promise<void> {
  const comment = await findCommentById(deps.db, input.commentId)
  if (!comment) throw new ThreadError('comment_not_found')

  if (!canDeleteComment(actor, comment)) {
    throw new ThreadError('forbidden')
  }

  await softDeleteComment(deps.db, input.commentId, new Date())
}
