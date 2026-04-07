import { requireSuperuser } from '~~/server/utils/auth'
import { runSyncMembers } from '~~/server/utils/sync-members'

export default defineEventHandler(async (event) => {
  await requireSuperuser(event)
  return await runSyncMembers()
})
