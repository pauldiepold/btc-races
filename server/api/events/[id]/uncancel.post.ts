import { db } from 'hub:db'
import { requireOwnerOrAdmin } from '~~/server/utils/auth'
import { loadEventOrThrow } from '~~/server/utils/load-entity'
import { requireEventIdParam } from '~~/server/utils/route-params'
import { actorFromSession, uncancelEvent, withEventErrorMapping } from '~~/server/events'

export default defineEventHandler(async (event) => {
  const id = requireEventIdParam(event)
  const dbEvent = await loadEventOrThrow(id)
  const session = await requireOwnerOrAdmin(event, dbEvent.createdBy ?? 0)

  const actor = actorFromSession(session)

  await withEventErrorMapping(() => uncancelEvent(id, actor, { db }))

  return { id: encodeEventId(id) }
})
