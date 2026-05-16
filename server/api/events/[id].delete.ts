import { db } from 'hub:db'
import { requireSuperuser } from '~~/server/utils/auth'
import { requireEventIdParam } from '~~/server/utils/route-params'
import { adminActor, deleteEvent, EventError, errorToHttpStatus } from '~~/server/events'

export default defineEventHandler(async (event) => {
  const session = await requireSuperuser(event)
  const id = requireEventIdParam(event)

  const actor = adminActor(session)

  try {
    await deleteEvent(id, actor, { db })
  }
  catch (err) {
    if (err instanceof EventError) {
      throw createError({ statusCode: errorToHttpStatus(err.code), statusMessage: err.message })
    }
    throw err
  }

  return { id: encodeEventId(id) }
})
