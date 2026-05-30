import { db } from 'hub:db'
import { z } from 'zod'
import { requireNumericIdParam } from '~~/server/utils/route-params'
import { parseBody } from '~~/server/utils/parse-body'
import { actorFromSession, createComment, withThreadErrorMapping } from '~~/server/threads'

const createCommentSchema = z.object({
  body: z.string().trim().min(1, 'Kommentar ist erforderlich').max(5000, 'Kommentar ist zu lang'),
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const id = requireNumericIdParam(event, 'Thread-ID')
  const data = await parseBody(event, createCommentSchema)

  const actor = actorFromSession(session)

  return withThreadErrorMapping(async () => {
    const { id: commentId } = await createComment(
      { threadId: id, body: data.body },
      actor,
      { db },
    )
    setResponseStatus(event, 201)
    return { id: commentId }
  })
})
