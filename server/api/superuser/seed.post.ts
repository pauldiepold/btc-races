import { requireSuperuser } from '~~/server/utils/auth'
import { runSeed } from '~~/server/utils/seed'

export default defineEventHandler(async (event) => {
  await requireSuperuser(event)
  return await runSeed()
})
