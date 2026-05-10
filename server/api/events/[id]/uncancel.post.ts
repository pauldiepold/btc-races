import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { requireAdmin } from '~~/server/utils/auth'
import { loadEventOrThrow } from '~~/server/utils/load-entity'
import { requireEventIdParam } from '~~/server/utils/route-params'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = requireEventIdParam(event)
  await loadEventOrThrow(id)

  await db
    .update(schema.events)
    .set({ cancelledAt: null, updatedAt: new Date() })
    .where(eq(schema.events.id, id))

  return { id: encodeEventId(id) }
})
