import { requireSuperuser } from '~~/server/utils/auth'
import { runGolive } from '~~/server/utils/seed-golive'

export default defineEventHandler(async (event) => {
  await requireSuperuser(event)
  return await runGolive()
})
