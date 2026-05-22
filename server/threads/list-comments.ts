import type { Comment } from '~~/shared/types/threads'
import { listCommentRows, type AppDb } from './persistence'

export type ListCommentsInput = {
  threadId: number
  /** Nur Kommentare, die nach diesem Zeitpunkt erstellt wurden (Delta-Polling). */
  since?: Date
}

export type ListCommentsDeps = {
  db: AppDb
}

/**
 * Liefert die Kommentare eines Threads in Chat-Reihenfolge (älteste zuerst).
 * Mit `since` nur die seither hinzugekommenen — für späteres Delta-Polling.
 */
export function listComments(
  input: ListCommentsInput,
  deps: ListCommentsDeps,
): Promise<Comment[]> {
  return listCommentRows(deps.db, input.threadId, input.since)
}
