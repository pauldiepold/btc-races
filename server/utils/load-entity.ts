import { eq } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'
import type { AppDb, EventRow } from '~~/server/registration'

export async function loadEventOrThrow(id: number, dbOverride?: AppDb): Promise<EventRow> {
  const db = dbOverride ?? (await import('hub:db')).db
  const dbEvent = await db.query.events.findFirst({ where: eq(schema.events.id, id) })
  if (!dbEvent) {
    throw createError({ statusCode: 404, statusMessage: 'Event nicht gefunden' })
  }
  return dbEvent
}
