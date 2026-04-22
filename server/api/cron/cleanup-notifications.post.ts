import { db, schema } from 'hub:db'
import { and, eq, lt } from 'drizzle-orm'

const RETENTION_DAYS = 90

/**
 * Entfernt abgeschlossene Notification-Jobs und deren Deliveries, die älter als 90 Tage sind.
 * Fehlgeschlagene Jobs bleiben für Debugging erhalten.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const authHeader = getHeader(event, 'Authorization')

  if (authHeader !== `Bearer ${config.cronToken}`) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000)

  // Deliveries zu alten Done-Jobs werden per ON DELETE CASCADE automatisch entfernt
  const deletedJobs = await db.delete(schema.notificationJobs)
    .where(
      and(
        eq(schema.notificationJobs.status, 'done'),
        lt(schema.notificationJobs.processedAt, cutoff),
      ),
    )
    .returning({ id: schema.notificationJobs.id })

  return {
    cutoff: cutoff.toISOString(),
    retentionDays: RETENTION_DAYS,
    deletedJobs: deletedJobs.length,
  }
})
