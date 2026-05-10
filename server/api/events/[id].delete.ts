import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { requireSuperuser } from '~~/server/utils/auth'
import { loadEventOrThrow } from '~~/server/utils/load-entity'
import { requireEventIdParam } from '~~/server/utils/route-params'

export default defineEventHandler(async (event) => {
  await requireSuperuser(event)
  const id = requireEventIdParam(event)
  await loadEventOrThrow(id)

  await db.delete(schema.events).where(eq(schema.events.id, id))

  return { id: encodeEventId(id) }
})
