import type { Thread } from '~~/shared/types/threads'
import { ThreadError } from './errors'
import { findThreadById, type AppDb } from './persistence'

export type GetThreadInput = {
  threadId: number
}

export type GetThreadDeps = {
  db: AppDb
}

/**
 * Lädt einen Thread per ID. Soft-gelöschte Threads werden mitgeliefert —
 * die Detailseite zeigt dafür einen Tombstone statt eines 404.
 */
export async function getThread(
  input: GetThreadInput,
  deps: GetThreadDeps,
): Promise<Thread> {
  const thread = await findThreadById(deps.db, input.threadId)
  if (!thread) throw new ThreadError('thread_not_found')
  return thread
}
