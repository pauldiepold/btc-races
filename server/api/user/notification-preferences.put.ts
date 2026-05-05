import { db, schema } from 'hub:db'
import { sql } from 'drizzle-orm'
import { z } from 'zod'
import { buildPreferencesResponse } from '~~/server/notifications/preferences'
import { NOTIFICATION_TYPES, getNotificationDefinition } from '~~/server/notifications/registry'

const bodySchema = z.object({
  preferences: z.array(z.object({
    type: z.enum(NOTIFICATION_TYPES),
    channel: z.enum(['email', 'push']),
    enabled: z.boolean(),
  })).min(1),
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const userId = session.user.id
  const role = session.user.role
  const isAdmin = role === 'admin' || role === 'superuser'

  const body = await readValidatedBody(event, bodySchema.parse)

  const toUpsert = body.preferences.filter((pref) => {
    const def = getNotificationDefinition(pref.type)
    if (!def) return false
    if (def.meta.adminOnly && !isAdmin) return false
    if (def.defaults[pref.channel].mandatory) return false
    return true
  })

  if (toUpsert.length > 0) {
    await db.insert(schema.notificationPreferences)
      .values(toUpsert.map(pref => ({
        userId,
        notificationType: pref.type,
        channel: pref.channel,
        enabled: pref.enabled ? 1 : 0,
      })))
      .onConflictDoUpdate({
        target: [
          schema.notificationPreferences.userId,
          schema.notificationPreferences.notificationType,
          schema.notificationPreferences.channel,
        ],
        set: { enabled: sql`excluded.enabled` },
      })
  }

  return buildPreferencesResponse(userId, isAdmin)
})
