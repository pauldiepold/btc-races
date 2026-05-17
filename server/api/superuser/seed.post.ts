import { requireSuperuser } from '~~/server/utils/auth'
import { runSeed } from '~~/server/utils/seed'

export default defineEventHandler(async (event) => {
  await requireSuperuser(event)
  if (useRuntimeConfig(event).public.isLive) {
    throw createError({ statusCode: 403, statusMessage: 'Seed im Live-Deployment nicht erlaubt' })
  }
  return await runSeed()
})
