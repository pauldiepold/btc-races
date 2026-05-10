import { runSyncMembers } from '~~/server/utils/sync-members'
import { requireCronAuth } from '~~/server/utils/cron-auth'

export default defineEventHandler(async (event) => {
  requireCronAuth(event)
  return await runSyncMembers()
})
