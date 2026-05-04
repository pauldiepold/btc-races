import { and, inArray, lt } from 'drizzle-orm'
import { executeDeliveries } from './service'
import type { NotificationRecipient } from './recipients'
import type { NotificationType } from '~~/shared/types/notifications'

const MAX_ATTEMPTS = 3
const PROCESSING_TIMEOUT_MS = 5 * 60 * 1000 // 5 Minuten

/**
 * Verarbeitet die Notification-Queue.
 *
 * Ablauf pro Lauf:
 *   1. `processing`-Jobs älter als 5 Minuten → `failed` (verwaiste Jobs)
 *   2. Retry-fähige Jobs (`pending` oder `failed`, attempts < 3) holen
 *   3. Backoff-Filter für failed Jobs (exponentiell: 2, 4, 8 Min)
 *   4. Pro Job: attempts++, Deliveries parallel ausführen, Status setzen
 */
export async function processQueue(): Promise<{
  processed: number
  succeeded: number
  failed: number
  resetOrphans: number
}> {
  const { db, schema } = await import('hub:db')
  const { eq } = await import('drizzle-orm')
  const now = Date.now()

  // 1. Verwaiste `processing`-Jobs zurücksetzen
  const orphanCutoff = new Date(now - PROCESSING_TIMEOUT_MS)
  const orphaned = await db.update(schema.notificationJobs)
    .set({
      status: 'failed',
      error: 'timeout: job stuck in processing',
      processedAt: new Date(),
    })
    .where(
      and(
        eq(schema.notificationJobs.status, 'processing'),
        lt(schema.notificationJobs.processedAt, orphanCutoff),
      ),
    )
    .returning({ id: schema.notificationJobs.id })

  // 2. Retry-fähige Jobs
  const retryableJobs = await db.select()
    .from(schema.notificationJobs)
    .where(
      and(
        inArray(schema.notificationJobs.status, ['pending', 'failed']),
        lt(schema.notificationJobs.attempts, MAX_ATTEMPTS),
      ),
    )

  // 3. Backoff-Filter (im App-Code; SQLite-Datumsrechnung ist fummelig)
  const eligibleJobs = retryableJobs.filter((job) => {
    if (!job.processedAt) return true
    const backoffMs = Math.pow(2, job.attempts) * 60 * 1000
    return now - job.processedAt.getTime() >= backoffMs
  })

  let succeeded = 0
  let failed = 0

  for (const job of eligibleJobs) {
    try {
      await db.update(schema.notificationJobs)
        .set({ status: 'processing', attempts: job.attempts + 1 })
        .where(eq(schema.notificationJobs.id, job.id))

      const storedPayload = JSON.parse(job.payload) as Record<string, unknown>
      const recipients = (storedPayload._recipients ?? []) as NotificationRecipient[]
      const { _recipients: _, ...payload } = storedPayload

      // Alte Deliveries des Jobs verwerfen (frischer Retry)
      await db.delete(schema.notificationDeliveries)
        .where(eq(schema.notificationDeliveries.jobId, job.id))

      const anySuccess = recipients.length === 0
        ? true
        : await executeDeliveries(job.id, job.type as NotificationType, recipients, payload, job.actorUserId ?? null)

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

  return {
    processed: eligibleJobs.length,
    succeeded,
    failed,
    resetOrphans: orphaned.length,
  }
}
