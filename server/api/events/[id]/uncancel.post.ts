import { db } from 'hub:db'
import { requireOwnerOrAdmin } from '~~/server/utils/auth'
import { loadEventOrThrow } from '~~/server/utils/load-entity'
import { requireEventIdParam } from '~~/server/utils/route-params'
import { actorFromSession, EventError, errorToHttpStatus, uncancelEvent } from '~~/server/events'

export default defineEventHandler(async (event) => {
  const id = requireEventIdParam(event)
  const dbEvent = await loadEventOrThrow(id)
  const session = await requireOwnerOrAdmin(event, dbEvent.createdBy ?? 0)

  const actor = actorFromSession(session)

  try {
    await uncancelEvent(id, actor, { db })
  }
  catch (err) {
    if (err instanceof EventError) {
      throw createError({ statusCode: errorToHttpStatus(err.code), statusMessage: err.message })
    }
    throw err
  }

  return { id: encodeEventId(id) }
})
