import { db } from 'hub:db'
import { z } from 'zod'
import type { Thread } from '~~/shared/types/threads'
import { ROOM_SLUGS } from '~~/shared/types/threads'
import { listThreads } from '~~/server/threads'

const querySchema = z.object({
  room: z.enum(ROOM_SLUGS).optional(),
})

export default defineEventHandler(async (event): Promise<Thread[]> => {
  await requireUserSession(event)

  const params = querySchema.safeParse(getQuery(event))
  if (!params.success) {
    throw createError({ statusCode: 400, statusMessage: 'Ungültige Query-Parameter' })
  }

  return listThreads({ roomSlug: params.data.room }, { db })
})
