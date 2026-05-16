import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { requireSuperuser } from '~~/server/utils/auth'
import { requireNumericIdParam } from '~~/server/utils/route-params'

/**
 * Setzt einen Notification-Job zurück, sodass er beim nächsten Queue-Lauf
 * wieder verarbeitet wird. Alte Deliveries werden erst beim Retry gelöscht.
 */
export default defineEventHandler(async (event) => {
  await requireSuperuser(event)
  const id = requireNumericIdParam(event, 'Job-ID')

  const job = await db.query.notificationJobs.findFirst({
    where: eq(schema.notificationJobs.id, id),
  })
  if (!job) {
    throw createError({ statusCode: 404, statusMessage: 'Job nicht gefunden' })
  }

  await db.update(schema.notificationJobs)
    .set({
      status: 'pending',
      attempts: 0,
      error: null,
      processedAt: null,
    })
    .where(eq(schema.notificationJobs.id, id))

  return { id, status: 'pending' }
})
