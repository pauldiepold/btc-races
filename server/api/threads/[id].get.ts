import { db } from 'hub:db'
import type { Thread } from '~~/shared/types/threads'
import { requireNumericIdParam } from '~~/server/utils/route-params'
import { getThread, withThreadErrorMapping } from '~~/server/threads'

export default defineEventHandler(async (event): Promise<Thread> => {
  await requireUserSession(event)
  const id = requireNumericIdParam(event, 'Thread-ID')

  return withThreadErrorMapping(() => getThread({ threadId: id }, { db }))
})
