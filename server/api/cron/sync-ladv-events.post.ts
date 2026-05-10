import { runSyncLadvEvents } from '~~/server/utils/sync-ladv-events'
import { requireCronAuth } from '~~/server/utils/cron-auth'

export default defineEventHandler(async (event) => {
  requireCronAuth(event)
  return await runSyncLadvEvents()
})
