import { db, schema } from 'hub:db'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    auth: z.string().min(1),
    p256dh: z.string().min(1),
  }),
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const body = await readValidatedBody(event, subscribeSchema.parse)
  const userId = session.user.id

  const userExists = await db.select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .get()

  if (!userExists) {
    await clearUserSession(event)
    throw createError({ statusCode: 401, statusMessage: 'Stale session — please log in again' })
  }

  const userAgent = getRequestHeader(event, 'user-agent') ?? ''
  const deviceHint = deriveDeviceHint(userAgent)

  // Upsert: bestehende Subscription aktualisieren oder neue anlegen
  const existing = await db.select({ id: schema.pushSubscriptions.id })
    .from(schema.pushSubscriptions)
    .where(
      and(
        eq(schema.pushSubscriptions.userId, userId),
        eq(schema.pushSubscriptions.endpoint, body.endpoint),
      ),
    )
    .get()

  if (existing) {
    await db.update(schema.pushSubscriptions)
      .set({
        keysAuth: body.keys.auth,
        keysP256dh: body.keys.p256dh,
        deviceHint,
      })
      .where(eq(schema.pushSubscriptions.id, existing.id))
  }
  else {
    await db.insert(schema.pushSubscriptions).values({
      userId,
      endpoint: body.endpoint,
      keysAuth: body.keys.auth,
      keysP256dh: body.keys.p256dh,
      deviceHint,
    })
  }

  return { ok: true }
})

function deriveDeviceHint(ua: string): 'iOS' | 'Android' | 'Desktop' {
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS'
  if (/android/i.test(ua)) return 'Android'
  return 'Desktop'
}
