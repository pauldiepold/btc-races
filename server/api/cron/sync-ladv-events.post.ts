import { runSyncLadvEvents } from '~~/server/utils/sync-ladv-events'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const authHeader = getHeader(event, 'Authorization')

  if (authHeader !== `Bearer ${config.cronToken}`) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  return await runSyncLadvEvents()
})
