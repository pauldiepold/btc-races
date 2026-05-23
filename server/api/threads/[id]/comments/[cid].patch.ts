import { db } from 'hub:db'
import { z } from 'zod'
import { requireNumericIdParam } from '~~/server/utils/route-params'
import { parseBody } from '~~/server/utils/parse-body'
import { actorFromSession, editComment, withThreadErrorMapping } from '~~/server/threads'

const editCommentSchema = z.object({
  body: z.string().trim().min(1, 'Kommentar ist erforderlich').max(5000, 'Kommentar ist zu lang'),
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const cid = requireNumericIdParam(event, 'Kommentar-ID', 'cid')
  const data = await parseBody(event, editCommentSchema)

  const actor = actorFromSession(session)

  await withThreadErrorMapping(() =>
    editComment({ commentId: cid, body: data.body }, actor, { db }),
  )

  setResponseStatus(event, 204)
  return null
})
