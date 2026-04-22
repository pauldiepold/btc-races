import { and, eq, inArray } from 'drizzle-orm'
import { emailService } from '~~/server/email/service'
import { EMAIL_TEMPLATE_MAP, EMAIL_SUBJECT_MAP, PUSH_PAYLOAD_MAP } from './templates'
import { pushService } from './push'
import { buildDeliveryTasks } from './delivery-builder'
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
 * Sendet eine Push-Notification an alle Geräte eines Empfängers.
 */
async function sendPushDelivery(
  type: NotificationType,
  recipient: NotificationRecipient,
  payload: Record<string, unknown>,
): Promise<string | null> {
  const payloadBuilder = PUSH_PAYLOAD_MAP[type]
  if (!payloadBuilder) return `Push payload not found for type: ${type}`

  const pushPayload = payloadBuilder(payload)
  await pushService.sendPushToUser(recipient.userId, pushPayload)
  return null
}

// ---------------------------------------------------------------------------
// Delivery-Loop — wird ausschließlich aus processQueue() aufgerufen
// ---------------------------------------------------------------------------

export async function executeDeliveries(
  jobId: number,
  type: NotificationType,
  recipients: NotificationRecipient[],
  payload: Record<string, unknown>,
): Promise<boolean> {
  const { db, schema } = await import('hub:db')

  const userIds = recipients.map(r => r.userId)

  // Preferences und Subscriptions parallel laden
  const [preferences, subscriptionRows] = userIds.length > 0
    ? await Promise.all([
        db.select()
          .from(schema.notificationPreferences)
          .where(
            and(
              inArray(schema.notificationPreferences.userId, userIds),
              eq(schema.notificationPreferences.notificationType, type),
            ),
          ),
        db.select({ userId: schema.pushSubscriptions.userId })
          .from(schema.pushSubscriptions)
          .where(inArray(schema.pushSubscriptions.userId, userIds)),
      ])
    : [[], []]

  const prefsByUser = new Map<number, typeof preferences>()
  for (const pref of preferences) {
    const existing = prefsByUser.get(pref.userId) ?? []
    existing.push(pref)
    prefsByUser.set(pref.userId, existing)
  }

  const subscribedUserIds = new Set(subscriptionRows.map(r => r.userId))

  const tasks = buildDeliveryTasks(type, recipients, prefsByUser, subscribedUserIds)

  if (tasks.length === 0) return true

  const results = await Promise.allSettled(tasks.map(async (task) => {
    let error: string | null = null
    try {
      if (task.channel === 'email') {
        error = await sendEmailDelivery(type, task.recipient, payload)
      }
      else {
        error = await sendPushDelivery(type, task.recipient, payload)
      }
    }
    catch (e) {
      error = e instanceof Error ? e.message : String(e)
    }
    return { task, error }
  }))

  // Deliveries schreiben (sequenziell, günstig gegenüber den Versand-Calls)
  let anySuccess = false
  for (const r of results) {
    if (r.status !== 'fulfilled') continue
    const { task, error } = r.value
    const success = error === null
    if (success) anySuccess = true

    await db.insert(schema.notificationDeliveries).values({
      jobId,
      channel: task.channel,
      recipientId: task.recipient.userId,
      status: success ? 'sent' : 'failed',
      error,
      sentAt: success ? new Date() : null,
    })
  }

  return anySuccess
}

// ---------------------------------------------------------------------------
// Public API — reine Queue: INSERT pending, Cron verarbeitet später
// ---------------------------------------------------------------------------

export async function enqueueNotification(options: SendNotificationOptions): Promise<SendNotificationResult> {
  const { db, schema } = await import('hub:db')
  const { type, payload, eventId } = options

  const recipients = await resolveRecipients(options.recipients)

  const storedPayload = JSON.stringify({ ...payload, eventId, _recipients: recipients })

  const rows = await db.insert(schema.notificationJobs).values({
    type,
    status: 'pending',
    payload: storedPayload,
    attempts: 0,
  }).returning({ id: schema.notificationJobs.id })

  return { jobId: rows[0]!.id }
}

export const notificationService = {
  enqueue: enqueueNotification,
}
