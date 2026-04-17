import { and, inArray, lt } from 'drizzle-orm'
import { executeDeliveries } from './service'
import type { NotificationRecipient, NotificationType } from './types'

const MAX_ATTEMPTS = 3

/**
 * Verarbeitet fehlgeschlagene/hängende Jobs mit exponentiellem Backoff.
 * Wird vom Cron-Endpoint aufgerufen.
 */
export async function processQueue(): Promise<{ processed: number, succeeded: number, failed: number }> {
  const { db, schema } = await import('hub:db')
  const { eq } = await import('drizzle-orm')
  const now = Date.now()

  // Retryable Jobs: (pending | failed) UND attempts < MAX_ATTEMPTS
  const retryableJobs = await db.select()
    .from(schema.notificationJobs)
    .where(
      and(
        inArray(schema.notificationJobs.status, ['pending', 'failed']),
        lt(schema.notificationJobs.attempts, MAX_ATTEMPTS),
      ),
    )

  // Backoff-Filter in App-Code (einfacher als SQLite-Datumsrechnung)
  const eligibleJobs = retryableJobs.filter((job) => {
    if (!job.processedAt) return true
    const backoffMs = Math.pow(2, job.attempts) * 60 * 1000
    return now - job.processedAt.getTime() >= backoffMs
  })

  let succeeded = 0
  let failed = 0

  for (const job of eligibleJobs) {
    try {
      // Attempts inkrementieren, Status auf processing
      await db.update(schema.notificationJobs)
        .set({ status: 'processing', attempts: job.attempts + 1 })
        .where(eq(schema.notificationJobs.id, job.id))

      // Payload parsen und Recipients extrahieren
      const storedPayload = JSON.parse(job.payload) as Record<string, unknown>
      const recipients = (storedPayload._recipients ?? []) as NotificationRecipient[]
      const { _recipients: _, ...payload } = storedPayload

      // Alte Deliveries für diesen Job löschen (frischer Retry)
      await db.delete(schema.notificationDeliveries)
        .where(eq(schema.notificationDeliveries.jobId, job.id))

      const anySuccess = await executeDeliveries(
        job.id,
        job.type as NotificationType,
        recipients,
        payload,
      )

      await db.update(schema.notificationJobs)
        .set({
          status: anySuccess ? 'done' : 'failed',
          processedAt: new Date(),
        })
        .where(eq(schema.notificationJobs.id, job.id))

      if (anySuccess) succeeded++
      else failed++
    }
    catch (e) {
      await db.update(schema.notificationJobs)
        .set({
          status: 'failed',
          error: e instanceof Error ? e.message : String(e),
          processedAt: new Date(),
        })
        .where(eq(schema.notificationJobs.id, job.id))
      failed++
    }
  }

  return { processed: eligibleJobs.length, succeeded, failed }
}
