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
  const templateProps = {
    ...payload,
    firstName: recipient.firstName,
    ...(recipient.disciplines ? { disciplines: recipient.disciplines } : {}),
  }
  const fallbackGreeting = recipient.firstName ? `Hallo ${recipient.firstName},` : 'Hallo,'

  function buildEventChangedFallbackContent() {
    const eventName = String(payload.eventName ?? 'Veranstaltung')
    const eventLink = typeof payload.eventLink === 'string'
      ? payload.eventLink
      : (typeof payload.eventUrl === 'string' ? payload.eventUrl : undefined)
    const lines = [
      fallbackGreeting,
      '',
      `bei ${eventName} haben sich Details geändert.`,
      'Bitte prüfe, ob du noch teilnehmen kannst.',
    ]
    if (eventLink) {
      lines.push('', `Zum Event: ${eventLink}`)
    }

    return {
      text: lines.join('\n'),
      html: [
        `<p>${fallbackGreeting}</p>`,
        `<p>bei <strong>${eventName}</strong> haben sich Details geändert.<br>Bitte prüfe, ob du noch teilnehmen kannst.</p>`,
        ...(eventLink ? [`<p><a href="${eventLink}">Zum Event</a></p>`] : []),
      ].join(''),
    }
  }

  let html = ''
  let text = ''
  try {
    const htmlResult = await renderEmailComponent(templateName, templateProps, { pretty: true })
    const textResult = await renderEmailComponent(templateName, templateProps, { plainText: true })

    html = typeof htmlResult === 'string' ? htmlResult : htmlResult.html
    text = typeof textResult === 'string' ? textResult : textResult.html
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const templateMissing = message.includes('template') && message.includes('not found')
    if (type === 'event_changed' && templateMissing) {
      // Fail-safe: verhindert Delivery-Ausfälle, falls Template-Registry zur Laufzeit unvollständig ist.
      const fallback = buildEventChangedFallbackContent()
      html = fallback.html
      text = fallback.text
      console.warn('[notifications] Fallback-Email für event_changed verwendet:', message)
    }
    else {
      throw error
    }
  }

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

// Per-Send-Timeout: schützt den Cron-Worker davor, dass ein hängender Email-Render
// oder ein nicht antwortender ACS-/Web-Push-Endpoint den ganzen Job-Lauf in Cloudflares
// Wall-Clock-Limit reißt. Bei Timeout wird die Delivery als `failed` geloggt und der
// Job kann sauber abgeschlossen werden — Retry läuft dann via Backoff.
const SEND_TIMEOUT_MS = 15_000

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout: ${label} > ${ms}ms`)), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
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
      const sendPromise = task.channel === 'email'
        ? sendEmailDelivery(type, task.recipient, payload)
        : sendPushDelivery(type, task.recipient, payload)
      error = await withTimeout(sendPromise, SEND_TIMEOUT_MS, `${task.channel} send`)
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
