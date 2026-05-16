import { db } from 'hub:db'
import { requireSuperuser } from '~~/server/utils/auth'
import { requireEventIdParam } from '~~/server/utils/route-params'
import { adminActor, deleteEvent, withEventErrorMapping } from '~~/server/events'

export default defineEventHandler(async (event) => {
  const session = await requireSuperuser(event)
  const id = requireEventIdParam(event)

  const actor = adminActor(session)

  await withEventErrorMapping(() => deleteEvent(id, actor, { db }))

  return { id: encodeEventId(id) }
})
