import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const sqid = getRouterParam(event, 'id')
  if (!sqid) {
    throw createError({ statusCode: 400, statusMessage: 'Fehlende Event-ID' })
  }

  const id = decodeEventId(sqid)
  if (id === null) {
    throw createError({ statusCode: 404, statusMessage: 'Event nicht gefunden' })
  }

  await requireAdmin(event)

  const dbEvent = await db.query.events.findFirst({
    where: eq(schema.events.id, id),
  })
  if (!dbEvent) {
    throw createError({ statusCode: 404, statusMessage: 'Event nicht gefunden' })
  }

  if (!dbEvent.cancelledAt) {
    await db
      .update(schema.events)
      .set({ cancelledAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.events.id, id))
  }

  return { id: sqid }
})
