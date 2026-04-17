import { and, eq, inArray } from 'drizzle-orm'
import { emailService } from '~~/server/email/service'
import { resolveChannelsForRecipient } from '~~/shared/utils/notifications'
import { EMAIL_TEMPLATE_MAP, EMAIL_SUBJECT_MAP } from './templates'
import type {
  NotificationRecipient,
  NotificationType,
  SendNotificationOptions,
  SendNotificationResult,
} from './types'

// ---------------------------------------------------------------------------
// Interne Helfer
// ---------------------------------------------------------------------------

async function resolveRecipients(
  recipients: SendNotificationOptions['recipients'],
): Promise<NotificationRecipient[]> {
  if (Array.isArray(recipients)) return recipients

  const { db, schema } = await import('hub:db')

  if (recipients === 'all_admins') {
    const rows = await db.select({
      userId: schema.users.id,
      email: schema.users.email,
      firstName: schema.users.firstName,
    })
      .from(schema.users)
      .where(inArray(schema.users.role, ['admin', 'superuser']))

    return rows.map(r => ({ userId: r.userId, email: r.email, firstName: r.firstName ?? undefined }))
  }

  // all_members
  const rows = await db.select({
    userId: schema.users.id,
    email: schema.users.email,
    firstName: schema.users.firstName,
  })
    .from(schema.users)
    .where(eq(schema.users.membershipStatus, 'active'))

  return rows.map(r => ({ userId: r.userId, email: r.email, firstName: r.firstName ?? undefined }))
}

/**
 * Sendet eine E-Mail für eine einzelne Delivery. Gibt Fehler-String oder null (Erfolg) zurück.
 */
async function sendEmailDelivery(
  type: NotificationType,
  recipient: NotificationRecipient,
  payload: Record<string, unknown>,
): Promise<string | null> {
  const templateName = EMAIL_TEMPLATE_MAP[type]
  if (!templateName) return `Template not found for type: ${type}`

  if (!recipient.email) return 'No email address'

  const subject = EMAIL_SUBJECT_MAP[type](payload)
  const templateProps = { ...payload, firstName: recipient.firstName }

  const htmlResult = await renderEmailComponent(templateName, templateProps, { pretty: true })
  const textResult = await renderEmailComponent(templateName, templateProps, { plainText: true })

  const html = typeof htmlResult === 'string' ? htmlResult : htmlResult.html
  const text = typeof textResult === 'string' ? textResult : textResult.html

  await emailService.sendEmail({
    to: [{ address: recipient.email, displayName: recipient.firstName }],
    subject,
    html,
    text,
  })

  return null
}

/**
 * Push-Delivery-Stub — loggt nur, gibt immer Erfolg zurück.
 */
async function sendPushDelivery(
  type: NotificationType,
  recipient: NotificationRecipient,
  _payload: Record<string, unknown>,
): Promise<string | null> {
  console.log(`[Push Stub] Would send ${type} to user ${recipient.userId}`)
  return null
}

// ---------------------------------------------------------------------------
// Delivery-Loop — von sendNotification() und processQueue() genutzt
// ---------------------------------------------------------------------------

export async function executeDeliveries(
  jobId: number,
  type: NotificationType,
  recipients: NotificationRecipient[],
  payload: Record<string, unknown>,
): Promise<boolean> {
  const { db, schema } = await import('hub:db')

  // Alle Preferences für diese Recipients + Typ in einer Query
  const userIds = recipients.map(r => r.userId)
  const preferences = userIds.length > 0
    ? await db.select()
        .from(schema.notificationPreferences)
        .where(
          and(
            inArray(schema.notificationPreferences.userId, userIds),
            eq(schema.notificationPreferences.notificationType, type),
          ),
        )
    : []

  // Preferences nach userId gruppieren
  const prefsByUser = new Map<number, typeof preferences>()
  for (const pref of preferences) {
    const existing = prefsByUser.get(pref.userId) ?? []
    existing.push(pref)
    prefsByUser.set(pref.userId, existing)
  }

  let anySuccess = false

  for (const recipient of recipients) {
    const userPrefs = prefsByUser.get(recipient.userId) ?? []
    const channels = resolveChannelsForRecipient(type, userPrefs)

    for (const channel of channels) {
      let error: string | null = null

      try {
        if (channel === 'email') {
          error = await sendEmailDelivery(type, recipient, payload)
        }
        else if (channel === 'push') {
          error = await sendPushDelivery(type, recipient, payload)
        }
      }
      catch (e) {
        error = e instanceof Error ? e.message : String(e)
      }

      const success = error === null
      if (success) anySuccess = true

      await db.insert(schema.notificationDeliveries).values({
        jobId,
        channel,
        recipientId: recipient.userId,
        status: success ? 'sent' : 'failed',
        error,
        sentAt: success ? new Date() : null,
      })
    }
  }

  return anySuccess
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function sendNotification(options: SendNotificationOptions): Promise<SendNotificationResult> {
  const { db, schema } = await import('hub:db')
  const { type, payload, eventId } = options

  // 1. Recipients auflösen
  const recipients = await resolveRecipients(options.recipients)

  // 2. Job erstellen (mit aufgelösten Recipients für Retry)
  const storedPayload = JSON.stringify({ ...payload, eventId, _recipients: recipients })

  const rows = await db.insert(schema.notificationJobs).values({
    type,
    status: 'processing',
    payload: storedPayload,
    attempts: 1,
  }).returning({ id: schema.notificationJobs.id })

  const jobId = rows[0]!.id

  // 3. Keine Empfänger → Job als done markieren
  if (recipients.length === 0) {
    await db.update(schema.notificationJobs)
      .set({ status: 'done', processedAt: new Date() })
      .where(eq(schema.notificationJobs.id, jobId))
    return { jobId }
  }

  try {
    // 4. Deliveries ausführen
    const anySuccess = await executeDeliveries(jobId, type, recipients, payload)

    // 5. Job-Status setzen
    await db.update(schema.notificationJobs)
      .set({
        status: anySuccess ? 'done' : 'failed',
        processedAt: new Date(),
      })
      .where(eq(schema.notificationJobs.id, jobId))
  }
  catch (e) {
    await db.update(schema.notificationJobs)
      .set({
        status: 'failed',
        error: e instanceof Error ? e.message : String(e),
        processedAt: new Date(),
      })
      .where(eq(schema.notificationJobs.id, jobId))
  }

  return { jobId }
}

export const notificationService = {
  send: sendNotification,
}
