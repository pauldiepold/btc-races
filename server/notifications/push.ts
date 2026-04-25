import { eq, inArray } from 'drizzle-orm'
import { buildPushPayload } from '@block65/webcrypto-web-push'
import type { PushSubscription, VapidKeys } from '@block65/webcrypto-web-push'

export interface PushPayload {
  title: string
  body: string
  url?: string
  icon?: string
}

function getVapidKeys(): VapidKeys {
  const config = useRuntimeConfig()
  return {
    subject: config.vapidSubject,
    publicKey: config.public.vapidPublicKey,
    privateKey: config.vapidPrivateKey,
  }
}

function toWebPushSubscription(row: {
  endpoint: string
  keysAuth: string
  keysP256dh: string
}): PushSubscription {
  return {
    endpoint: row.endpoint,
    expirationTime: null,
    keys: {
      auth: row.keysAuth,
      p256dh: row.keysP256dh,
    },
  }
}

/**
 * Sendet eine Push-Notification an eine einzelne Subscription.
 * Bei HTTP 410 (Gone) wird die Subscription aus der DB gelöscht.
 */
async function sendPush(
  subscriptionRow: { id: number, endpoint: string, keysAuth: string, keysP256dh: string },
  payload: PushPayload,
): Promise<void> {
  const vapid = getVapidKeys()
  const subscription = toWebPushSubscription(subscriptionRow)

  const { headers, body, method } = await buildPushPayload(
    { data: JSON.parse(JSON.stringify(payload)), options: { urgency: 'normal', ttl: 86400 } },
    subscription,
    vapid,
  )

  const response = await fetch(subscriptionRow.endpoint, {
    method,
    headers,
    body: body as unknown as BodyInit,
  })

  if (response.status === 410 || response.status === 404) {
    const { db, schema } = await import('hub:db')
    await db.delete(schema.pushSubscriptions)
      .where(eq(schema.pushSubscriptions.id, subscriptionRow.id))
    throw new Error('subscription expired')
  }

  if (!response.ok) {
    throw new Error(`Push failed: ${response.status} ${response.statusText}`)
  }
}

/**
 * Sendet eine Push-Notification an alle Geräte eines Users.
 */
async function sendPushToUser(userId: number, payload: PushPayload): Promise<void> {
  const { db, schema } = await import('hub:db')

  const subscriptions = await db.select()
    .from(schema.pushSubscriptions)
    .where(eq(schema.pushSubscriptions.userId, userId))

  if (subscriptions.length === 0) {
    console.warn('[push] sendPushToUser: no push_subscriptions row for user', { userId })
    throw new Error(`sendPushToUser called for userId ${userId} without active subscriptions`)
  }

  const errors: Error[] = []

  for (const sub of subscriptions) {
    try {
      await sendPush(sub, payload)
    }
    catch (e) {
      const error = e instanceof Error ? e : new Error(String(e))
      // "subscription expired" ist kein Fehler, der hochgeworfen werden muss
      if (error.message !== 'subscription expired') {
        errors.push(error)
      }
    }
  }

  if (errors.length > 0 && errors.length === subscriptions.length) {
    throw errors[0]!
  }
}

/**
 * Sendet eine Push-Notification an mehrere User (Batch).
 */
async function sendPushToUsers(userIds: number[], payload: PushPayload): Promise<void> {
  const { db, schema } = await import('hub:db')

  const subscriptions = await db.select()
    .from(schema.pushSubscriptions)
    .where(inArray(schema.pushSubscriptions.userId, userIds))

  for (const sub of subscriptions) {
    try {
      await sendPush(sub, payload)
    }
    catch {
      // Fehler werden pro Delivery im Notification-Service geloggt
    }
  }
}

export interface PushBroadcastStats {
  subscriptions: number
  users: number
  sent: number
  expired: number
  failed: number
}

/**
 * Sendet eine Push-Notification an ALLE registrierten Subscriptions im System.
 * Gibt detaillierte Statistiken zurück. Nur für Admin-/Test-Zwecke gedacht.
 */
async function sendPushToAll(payload: PushPayload): Promise<PushBroadcastStats> {
  const { db, schema } = await import('hub:db')

  const subscriptions = await db.select().from(schema.pushSubscriptions)
  const uniqueUsers = new Set(subscriptions.map(s => s.userId))

  let sent = 0
  let expired = 0
  let failed = 0

  for (const sub of subscriptions) {
    try {
      await sendPush(sub, payload)
      sent++
    }
    catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      if (message === 'subscription expired') expired++
      else failed++
    }
  }

  return {
    subscriptions: subscriptions.length,
    users: uniqueUsers.size,
    sent,
    expired,
    failed,
  }
}

export const pushService = {
  sendPush,
  sendPushToUser,
  sendPushToUsers,
  sendPushToAll,
}
