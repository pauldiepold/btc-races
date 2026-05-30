import { db } from 'hub:db'
import { z } from 'zod'
import { requireNumericIdParam } from '~~/server/utils/route-params'
import { parseBody } from '~~/server/utils/parse-body'
import { actorFromSession, editThread, withThreadErrorMapping } from '~~/server/threads'

const editThreadSchema = z.object({
  title: z.string().trim().min(1, 'Titel ist erforderlich').max(200, 'Titel ist zu lang'),
  body: z.string().trim().min(1, 'Text ist erforderlich').max(5000, 'Text ist zu lang'),
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const id = requireNumericIdParam(event, 'Thread-ID')
  const data = await parseBody(event, editThreadSchema)

  const actor = actorFromSession(session)

  await withThreadErrorMapping(() =>
    editThread({ threadId: id, title: data.title, body: data.body }, actor, { db }),
  )

  setResponseStatus(event, 204)
  return null
})
