import type { RoomSlug, ThreadListItem } from '~~/shared/types/threads'
import { countCommentsByThread, listThreadRows, type AppDb } from './persistence'

export type ListThreadsFilter = {
  roomSlug?: RoomSlug
}

export type ListThreadsDeps = {
  db: AppDb
}

/**
 * Liefert die Beiträge eines Raums (oder aller Räume) — neueste Aktivität zuerst,
 * soft-gelöschte ausgenommen, je mit Kommentaranzahl für die Listendarstellung.
 */
export async function listThreads(
  filter: ListThreadsFilter,
  deps: ListThreadsDeps,
): Promise<ThreadListItem[]> {
  const rows = await listThreadRows(deps.db, filter.roomSlug)
  const counts = await countCommentsByThread(deps.db, rows.map(row => row.id))
  return rows.map(row => ({ ...row, commentCount: counts.get(row.id) ?? 0 }))
}
