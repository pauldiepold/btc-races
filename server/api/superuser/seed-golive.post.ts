import { requireSuperuser } from '~~/server/utils/auth'
import { runGolive } from '~~/server/utils/seed-golive'

export default defineEventHandler(async (event) => {
  await requireSuperuser(event)
  if (useRuntimeConfig(event).public.isLive) {
    throw createError({ statusCode: 403, statusMessage: 'Go-Live-Seed im Live-Deployment nicht erlaubt' })
  }
  return await runGolive()
})
