import { db } from 'hub:db'
import { requireOwnerOrAdmin } from '~~/server/utils/auth'
import { loadEventOrThrow } from '~~/server/utils/load-entity'
import { requireEventIdParam } from '~~/server/utils/route-params'
import { cancelEvent, EventError, errorToHttpStatus, type EventActor } from '~~/server/events'

export default defineEventHandler(async (event) => {
  const id = requireEventIdParam(event)
  const dbEvent = await loadEventOrThrow(id)
  const session = await requireOwnerOrAdmin(event, dbEvent.createdBy ?? 0)

  const isAdminRole = session.user.role === 'admin' || session.user.role === 'superuser'
  const isSuperuser = session.user.role === 'superuser'

  const actor: EventActor = isAdminRole
    ? { kind: 'admin', userId: session.user.id, isSuperuser }
    : { kind: 'owner', userId: session.user.id }

  try {
    await cancelEvent(id, actor, { db })
  }
  catch (err) {
    if (err instanceof EventError) {
      throw createError({ statusCode: errorToHttpStatus(err.code), statusMessage: err.message })
    }
    throw err
  }

  return { id: encodeEventId(id) }
})
