import type { ThreadActor } from './actor'
import { ThreadError } from './errors'
import { dispatchNewCommentNotification } from './notifier'
import { findThreadById, insertComment, touchThreadActivity, type AppDb } from './persistence'

/** Maximale Kommentar-Länge (Zeichen, getrimmt) — serverseitiger Schutz. */
const MAX_COMMENT_LENGTH = 5000

export type CreateCommentInput = {
  threadId: number
  body: string
}

export type CreateCommentDeps = {
  db: AppDb
}

export type CreateCommentResult = {
  id: number
}

/**
 * Hängt einen Kommentar an einen Thread an und hebt dessen `lastActivityAt`
 * auf die Kommentar-Zeit — der Thread wandert dadurch in der Raum-Liste nach oben.
 */
export async function createComment(
  input: CreateCommentInput,
  actor: ThreadActor,
  deps: CreateCommentDeps,
): Promise<CreateCommentResult> {
  if (input.body.trim().length > MAX_COMMENT_LENGTH) {
    throw new ThreadError('comment_too_long')
  }

  const thread = await findThreadById(deps.db, input.threadId)
  if (!thread) throw new ThreadError('thread_not_found')
  if (thread.deletedAt !== null) throw new ThreadError('thread_deleted')

  const comment = await insertComment(deps.db, {
    threadId: input.threadId,
    userId: actor.userId,
    body: input.body,
  })

  await touchThreadActivity(deps.db, input.threadId, comment.createdAt)

  await dispatchNewCommentNotification(thread, comment, actor.userId, deps.db)

  return { id: comment.id }
}
