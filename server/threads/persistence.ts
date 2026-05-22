import { and, desc, eq, isNull } from 'drizzle-orm'
import type { db as hubDb } from 'hub:db'
import * as schema from '~~/server/db/schema'
import type { RoomSlug } from '~~/shared/types/threads'

export type AppDb = typeof hubDb

export type ThreadRow = typeof schema.threads.$inferSelect
export type ThreadInsert = typeof schema.threads.$inferInsert

export async function insertThread(db: AppDb, values: ThreadInsert): Promise<ThreadRow> {
  const [row] = await db.insert(schema.threads).values(values).returning()
  return row!
}

/**
 * Nicht gelöschte Threads, neueste Aktivität zuerst. Optional auf einen Raum
 * gefiltert.
 */
export function listThreadRows(db: AppDb, roomSlug?: RoomSlug): Promise<ThreadRow[]> {
  return db.query.threads.findMany({
    where: roomSlug
      ? and(isNull(schema.threads.deletedAt), eq(schema.threads.roomSlug, roomSlug))
      : isNull(schema.threads.deletedAt),
    orderBy: desc(schema.threads.lastActivityAt),
  })
}
