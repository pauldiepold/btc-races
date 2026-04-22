import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { requireSuperuser } from '~~/server/utils/auth'

/**
 * Setzt einen Notification-Job zurück, sodass er beim nächsten Queue-Lauf
 * wieder verarbeitet wird. Alte Deliveries werden erst beim Retry gelöscht.
 */
export default defineEventHandler(async (event) => {
  await requireSuperuser(event)

  const rawId = getRouterParam(event, 'id')
  if (!rawId) {
    throw createError({ statusCode: 400, statusMessage: 'Fehlende Job-ID' })
  }

  const id = Number(rawId)
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Ungültige Job-ID' })
  }

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
