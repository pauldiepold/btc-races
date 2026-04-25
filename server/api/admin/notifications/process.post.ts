import { processQueue } from '~~/server/notifications/process'
import { requireSuperuser } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireSuperuser(event)

  try {
    const result = await processQueue()
    return result
  }
  catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Queue-Verarbeitung fehlgeschlagen.',
      data: {
        message: error instanceof Error ? error.message : String(error),
      },
    })
  }
})
