import { and, eq, inArray } from 'drizzle-orm'
import type { z } from 'zod'
import { emailService } from '~~/server/email/service'
import { formatActorName } from '~~/shared/utils/format-actor-name'
import type { NotificationType } from '~~/shared/types/notifications'
import { getNotificationDefinition } from './registry'
import type { AnyNotificationDefinition, NotificationActor, notificationRegistry } from './registry'
import { pushService } from './push'
import { buildDeliveryTasks } from './delivery-builder'
import type { NotificationRecipient } from './recipients'

export type { NotificationRecipient } from './recipients'

type PayloadOf<T extends NotificationType>
  = (typeof notificationRegistry)[T]['payload'] extends z.ZodType<infer P> ? P : never

type ActorRequirementOf<T extends NotificationType> = (typeof notificationRegistry)[T]['actor']

/**
 * Argumentform für `notify()`. `actorUserId` ist required, wenn der Notification-Typ
 * `actor: 'required'` deklariert; sonst optional bzw. nicht erlaubt.
 */
export type NotifyOptions<T extends NotificationType> = {
  type: T
  recipients: NotificationRecipient[]
  payload: PayloadOf<T>
  eventId?: number
} & (ActorRequirementOf<T> extends 'required'
  ? { actorUserId: number }
  : { actorUserId?: number })

interface NotifyResult {
  jobId: number
}

/**
 * Resolved Actor mit Name + Originalfeldern (für Template-Props memberFirstName/Last).
 */
interface ResolvedActor extends NotificationActor {
  firstName: string
  lastName: string
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Validiert Payload gegen Registry-Schema und legt einen Notification-Job in die Queue.
 * Wirft bei Schema-Verletzung — Aufrufer (API-Route) sollte try/catch verwenden.
 */
export async function notify<T extends NotificationType>(options: NotifyOptions<T>): Promise<NotifyResult> {
  const { db, schema } = await import('hub:db')
  const { type, recipients, payload, eventId } = options
  const actorUserId = (options as { actorUserId?: number }).actorUserId

  const definition = getNotificationDefinition(type)

  // C1: Payload-Validierung beim Enqueue. Programmierfehler → API-Route bekommt Error.
  definition.payload.parse(payload)

  if (definition.actor === 'required' && actorUserId == null) {
    throw new Error(`notify(${type}): actorUserId is required`)
  }

  const storedPayload = JSON.stringify({ ...(payload as object), eventId, _recipients: recipients })

  const rows = await db.insert(schema.notificationJobs).values({
    type,
    status: 'pending',
    payload: storedPayload,
    actorUserId: actorUserId ?? null,
    attempts: 0,
  }).returning({ id: schema.notificationJobs.id })

  return { jobId: rows[0]!.id }
}

// ---------------------------------------------------------------------------
// Delivery-Loop — wird ausschließlich aus processQueue() aufgerufen
// ---------------------------------------------------------------------------

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

async function resolveActor(actorUserId: number | null): Promise<ResolvedActor | undefined> {
  if (actorUserId == null) return undefined
  const { db, schema } = await import('hub:db')
  const row = await db.query.users.findFirst({
    where: eq(schema.users.id, actorUserId),
    columns: { id: true, firstName: true, lastName: true },
  })
  if (!row) return undefined
  const firstName = row.firstName ?? ''
  const lastName = row.lastName ?? ''
  return {
    userId: row.id,
    firstName,
    lastName,
    name: formatActorName(firstName, lastName),
  }
}

function buildEmailTemplateProps(
  payload: Record<string, unknown>,
  recipient: NotificationRecipient,
  actor: ResolvedActor | undefined,
): Record<string, unknown> {
  return {
    ...payload,
    firstName: recipient.firstName,
    ...(recipient.disciplines ? { disciplines: recipient.disciplines } : {}),
    ...(actor
      ? {
          adminName: actor.name,
          actorName: actor.name,
          memberFirstName: actor.firstName,
          memberLastName: actor.lastName,
        }
      : {}),
  }
}

async function sendEmailDelivery(
  type: NotificationType,
  recipient: NotificationRecipient,
  payload: Record<string, unknown>,
  actor: ResolvedActor | undefined,
): Promise<string | null> {
  if (!recipient.email) return 'No email address'

  const definition: AnyNotificationDefinition = getNotificationDefinition(type)
  const ctx = { actor }
  const subject = definition.email.subject(payload, ctx)

  const templateProps = buildEmailTemplateProps(payload, recipient, actor)

  const htmlResult = await renderEmailComponent(definition.email.component, templateProps, { pretty: true })
  const textResult = await renderEmailComponent(definition.email.component, templateProps, { plainText: true })

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

async function sendPushDelivery(
  type: NotificationType,
  recipient: NotificationRecipient,
  payload: Record<string, unknown>,
  actor: ResolvedActor | undefined,
): Promise<string | null> {
  const definition: AnyNotificationDefinition = getNotificationDefinition(type)
  const ctx = { actor }
  const pushPayload = definition.push(payload, ctx)
  await pushService.sendPushToUser(recipient.userId, pushPayload)
  return null
}

export async function executeDeliveries(
  jobId: number,
  type: NotificationType,
  recipients: NotificationRecipient[],
  payload: Record<string, unknown>,
  actorUserId: number | null,
): Promise<boolean> {
  const { db, schema } = await import('hub:db')

  const userIds = recipients.map(r => r.userId)

  const [preferences, subscriptionRows, actor] = await Promise.all([
    userIds.length > 0
      ? db.select()
          .from(schema.notificationPreferences)
          .where(
            and(
              inArray(schema.notificationPreferences.userId, userIds),
              eq(schema.notificationPreferences.notificationType, type),
            ),
          )
      : Promise.resolve([] as Array<typeof schema.notificationPreferences.$inferSelect>),
    userIds.length > 0
      ? db.select({ userId: schema.pushSubscriptions.userId })
          .from(schema.pushSubscriptions)
          .where(inArray(schema.pushSubscriptions.userId, userIds))
      : Promise.resolve([] as Array<{ userId: number }>),
    resolveActor(actorUserId),
  ])

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
        ? sendEmailDelivery(type, task.recipient, payload, actor)
        : sendPushDelivery(type, task.recipient, payload, actor)
      error = await withTimeout(sendPromise, SEND_TIMEOUT_MS, `${task.channel} send`)
    }
    catch (e) {
      error = e instanceof Error ? e.message : String(e)
    }
    return { task, error }
  }))

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

export const notificationService = {
  notify,
}
