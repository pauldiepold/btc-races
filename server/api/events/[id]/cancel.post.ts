import { db } from 'hub:db'
import { z } from 'zod'
import { requireOwnerOrAdmin } from '~~/server/utils/auth'
import { loadEventOrThrow } from '~~/server/utils/load-entity'
import { parseBody } from '~~/server/utils/parse-body'
import { requireEventIdParam } from '~~/server/utils/route-params'
import { actorFromSession, cancelEvent, withEventErrorMapping } from '~~/server/events'

const cancelEventSchema = z.object({
  reason: z.string().trim().max(500, 'Grund darf höchstens 500 Zeichen lang sein').optional(),
}).optional()

export default defineEventHandler(async (event) => {
  const id = requireEventIdParam(event)
  const dbEvent = await loadEventOrThrow(id)
  const session = await requireOwnerOrAdmin(event, dbEvent.createdBy ?? 0)

  const body = await parseBody(event, cancelEventSchema)
  const actor = actorFromSession(session)

  await withEventErrorMapping(() => cancelEvent(id, actor, { db }, body?.reason))

  return { id: encodeEventId(id) }
})
