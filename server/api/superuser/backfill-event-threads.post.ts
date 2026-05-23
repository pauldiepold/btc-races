import { db } from 'hub:db'
import { requireSuperuser } from '~~/server/utils/auth'
import { backfillEventThreads } from '~~/server/threads'

export default defineEventHandler(async (event) => {
  await requireSuperuser(event)
  const result = await backfillEventThreads({ db })
  return { ok: true, ...result }
})
