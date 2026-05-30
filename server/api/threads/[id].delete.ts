import { db } from 'hub:db'
import { requireNumericIdParam } from '~~/server/utils/route-params'
import { actorFromSession, deleteThread, withThreadErrorMapping } from '~~/server/threads'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const id = requireNumericIdParam(event, 'Thread-ID')

  const actor = actorFromSession(session)

  await withThreadErrorMapping(() => deleteThread({ threadId: id }, actor, { db }))

  setResponseStatus(event, 204)
  return null
})
