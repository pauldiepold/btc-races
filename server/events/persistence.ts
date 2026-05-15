import { eq } from 'drizzle-orm'
import type { db as hubDb } from 'hub:db'
import * as schema from '~~/server/db/schema'

export type AppDb = typeof hubDb

export type EventRow = typeof schema.events.$inferSelect
export type EventInsert = typeof schema.events.$inferInsert

export function loadEventById(db: AppDb, id: number): Promise<EventRow | undefined> {
  return db.query.events.findFirst({ where: eq(schema.events.id, id) })
}

export async function updateEvent(
  db: AppDb,
  id: number,
  patch: Partial<EventInsert>,
): Promise<void> {
  await db.update(schema.events).set(patch).where(eq(schema.events.id, id))
}
