import { requireSuperuser } from '~~/server/utils/auth'
import { runSyncLadvEvents } from '~~/server/utils/sync-ladv-events'

export default defineEventHandler(async (event) => {
  await requireSuperuser(event)
  return await runSyncLadvEvents()
})
