import { requireAdmin } from '~~/server/utils/auth'
import { runSyncMembers } from '~~/server/utils/sync-members'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return await runSyncMembers()
})
