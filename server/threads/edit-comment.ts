import type { ThreadActor } from './actor'
import { ThreadError } from './errors'
import { findCommentById, updateCommentBody, type AppDb } from './persistence'
import { canEditComment } from './rules'

/** Maximale Kommentar-Länge (Zeichen, getrimmt) — Spiegel zu `create-comment`. */
const MAX_COMMENT_LENGTH = 5000

export type EditCommentInput = {
  commentId: number
  body: string
}

export type EditCommentDeps = {
  db: AppDb
}

/**
 * Editiert den Body eines Kommentars. Nur der Autor; nicht bei soft-gelöschten.
 * `updatedAt` zieht Drizzle automatisch nach (`(bearbeitet)`-Label im UI).
 * Hebt `lastActivityAt` des Threads NICHT.
 */
export async function editComment(
  input: EditCommentInput,
  actor: ThreadActor,
  deps: EditCommentDeps,
): Promise<void> {
  const comment = await findCommentById(deps.db, input.commentId)
  if (!comment) throw new ThreadError('comment_not_found')

  if (!canEditComment(actor, comment)) {
    throw new ThreadError('forbidden')
  }

  if (input.body.trim().length > MAX_COMMENT_LENGTH) {
    throw new ThreadError('comment_too_long')
  }

  await updateCommentBody(deps.db, input.commentId, input.body)
}
