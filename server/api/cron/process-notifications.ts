import { processQueue } from '~~/server/notifications/process'
import { requireCronAuth } from '~~/server/utils/cron-auth'

export default defineEventHandler(async (event) => {
  requireCronAuth(event)
  return await processQueue()
})
