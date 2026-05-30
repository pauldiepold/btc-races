import { db } from 'hub:db'
import { z } from 'zod'
import { requireNumericIdParam } from '~~/server/utils/route-params'
import { parseBody } from '~~/server/utils/parse-body'
import { actorFromSession, setOverride, withThreadErrorMapping } from '~~/server/threads'

const setOverrideSchema = z.object({
  state: z.enum(['muted', 'following']).nullable(),
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const id = requireNumericIdParam(event, 'Thread-ID')
  const data = await parseBody(event, setOverrideSchema)

  const actor = actorFromSession(session)

  return withThreadErrorMapping(async () => {
    await setOverride({ threadId: id, state: data.state }, actor, { db })
    setResponseStatus(event, 204)
    return null
  })
})
