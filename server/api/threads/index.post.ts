import { db } from 'hub:db'
import { z } from 'zod'
import { ROOM_SLUGS } from '~~/shared/types/threads'
import { parseBody } from '~~/server/utils/parse-body'
import { actorFromSession, createThread, withThreadErrorMapping } from '~~/server/threads'

const createThreadSchema = z.object({
  roomSlug: z.enum(ROOM_SLUGS),
  title: z.string().trim().min(1, 'Titel ist erforderlich').max(200, 'Titel ist zu lang'),
  body: z.string().trim().min(1, 'Text ist erforderlich').max(5000, 'Text ist zu lang'),
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const data = await parseBody(event, createThreadSchema)

  const actor = actorFromSession(session)

  return withThreadErrorMapping(async () => {
    const { id } = await createThread(data, actor, { db })
    setResponseStatus(event, 201)
    return { id }
  })
})
