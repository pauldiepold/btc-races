import { db } from 'hub:db'
import { requireNumericIdParam } from '~~/server/utils/route-params'
import { actorFromSession, pinComment, withThreadErrorMapping } from '~~/server/threads'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const cid = requireNumericIdParam(event, 'Kommentar-ID', 'cid')

  const actor = actorFromSession(session)

  await withThreadErrorMapping(() => pinComment({ commentId: cid }, actor, { db }))

  setResponseStatus(event, 204)
  return null
})
