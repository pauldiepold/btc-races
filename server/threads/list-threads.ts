import type { RoomSlug, Thread } from '~~/shared/types/threads'
import { listThreadRows, type AppDb } from './persistence'

export type ListThreadsFilter = {
  roomSlug?: RoomSlug
}

export type ListThreadsDeps = {
  db: AppDb
}

/**
 * Liefert die Beiträge eines Raums (oder aller Räume) — neueste Aktivität zuerst,
 * soft-gelöschte ausgenommen.
 */
export function listThreads(
  filter: ListThreadsFilter,
  deps: ListThreadsDeps,
): Promise<Thread[]> {
  return listThreadRows(deps.db, filter.roomSlug)
}
