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
 *
 * Soft-gelöschte Kommentare werden als Tombstone mit leerem Body ausgeliefert —
 * der Originaltext verlässt nie den Server, „gelöscht" ist endgültig. Die DB-Row
 * behält den Body (Audit/Historie), nur das Lesemodell redigiert ihn.
 */
export async function listComments(
  input: ListCommentsInput,
  deps: ListCommentsDeps,
): Promise<Comment[]> {
  const rows = await listCommentRows(deps.db, input.threadId, input.since)
  return rows.map(row => (row.deletedAt !== null ? { ...row, body: '' } : row))
}
