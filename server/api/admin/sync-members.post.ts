import { requireSuperuser } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireSuperuser(event)
  return await runTask('sync-members')
})
