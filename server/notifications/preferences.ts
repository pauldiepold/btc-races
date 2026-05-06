import { eq } from 'drizzle-orm'
import type { NotificationChannel, NotificationChannelDefaults, NotificationType } from '~~/shared/types/notifications'
import { NOTIFICATION_TYPES, getNotificationDefinition } from './registry'

export interface NotificationPreferenceChannelState {
  enabled: boolean
  mandatory: boolean
}

export interface NotificationPreferenceEntry {
  type: NotificationType
  label: string
  description: string
  adminOnly: boolean
  email: NotificationPreferenceChannelState
  push: NotificationPreferenceChannelState
}

export interface NotificationPreferencesResponse {
  preferences: NotificationPreferenceEntry[]
}

/**
 * Lädt die User-Overrides und merged sie mit Defaults + Meta zu einer fertigen API-Response.
 * Admin-Only-Typen werden für nicht-Admins gefiltert.
 */
export async function buildPreferencesResponse(
  userId: number,
  isAdmin: boolean,
): Promise<NotificationPreferencesResponse> {
  const { db, schema } = await import('hub:db')

  const rows = await db.select({
    notificationType: schema.notificationPreferences.notificationType,
    channel: schema.notificationPreferences.channel,
    enabled: schema.notificationPreferences.enabled,
  })
    .from(schema.notificationPreferences)
    .where(eq(schema.notificationPreferences.userId, userId))

  const overrideMap = new Map<string, boolean>()
  for (const row of rows) {
    overrideMap.set(`${row.notificationType}:${row.channel}`, row.enabled === 1)
  }

  const preferences: NotificationPreferenceEntry[] = NOTIFICATION_TYPES
    .filter((type) => {
      const def = getNotificationDefinition(type)
      return isAdmin || !def.meta.adminOnly
    })
    .map((type) => {
      const def = getNotificationDefinition(type)
      return {
        type,
        label: def.meta.label,
        description: def.meta.description,
        adminOnly: def.meta.adminOnly,
        email: resolveChannelState(type, 'email', def.defaults.email, overrideMap),
        push: resolveChannelState(type, 'push', def.defaults.push, overrideMap),
      }
    })

  return { preferences }
}

function resolveChannelState(
  type: NotificationType,
  channel: NotificationChannel,
  defaults: NotificationChannelDefaults,
  overrideMap: Map<string, boolean>,
): NotificationPreferenceChannelState {
  if (defaults.mandatory) {
    return { enabled: true, mandatory: true }
  }
  const override = overrideMap.get(`${type}:${channel}`)
  return {
    enabled: override ?? defaults.default,
    mandatory: false,
  }
}
