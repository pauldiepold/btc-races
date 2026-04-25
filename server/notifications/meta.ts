import { eq } from 'drizzle-orm'
import type { NotificationChannel, NotificationType } from '~~/shared/types/notifications'
import { NOTIFICATION_DEFAULTS } from '~~/shared/types/notifications'

export interface NotificationMeta {
  label: string
  description: string
  adminOnly: boolean
}

/**
 * UI-Metadaten pro NotificationType. Reihenfolge der Keys bestimmt die Reihenfolge in der UI.
 */
export const NOTIFICATION_META: Record<NotificationType, NotificationMeta> = {
  ladv_registered: {
    label: 'LADV-Meldung bestätigt',
    description: 'Wenn der Coach dich für einen Wettkampf in LADV gemeldet hat.',
    adminOnly: false,
  },
  ladv_canceled: {
    label: 'LADV-Abmeldung',
    description: 'Wenn der Coach dich wieder aus LADV abgemeldet hat.',
    adminOnly: false,
  },
  athlete_canceled_after_ladv: {
    label: 'Stornierung nach LADV-Meldung',
    description: 'Wenn ein bereits gemeldetes Mitglied seine Anmeldung storniert.',
    adminOnly: true,
  },
  event_canceled: {
    label: 'Event abgesagt',
    description: 'Wenn ein Event abgesagt wird, für das du angemeldet bist.',
    adminOnly: false,
  },
  event_changed: {
    label: 'Event geändert',
    description: 'Wenn sich Datum, Uhrzeit oder Ort eines Events ändern, für das du angemeldet bist.',
    adminOnly: false,
  },
  new_event: {
    label: 'Neues Event',
    description: 'Wenn ein neuer Wettkampf veröffentlicht wird.',
    adminOnly: false,
  },
  reminder_deadline_athlete: {
    label: 'Erinnerung: Meldefrist',
    description: '5 Tage vor Ablauf der Meldefrist für Events, für die du angemeldet bist.',
    adminOnly: false,
  },
  reminder_deadline_admin: {
    label: 'Admin: Meldefrist-Erinnerung',
    description: '3 Tage vor Ablauf der Meldefrist für alle aktiven Events.',
    adminOnly: true,
  },
  reminder_event: {
    label: 'Event-Erinnerung',
    description: '2 Tage vor Beginn eines Events, für das du angemeldet bist.',
    adminOnly: false,
  },
}

export const NOTIFICATION_TYPES = Object.keys(NOTIFICATION_META) as [NotificationType, ...NotificationType[]]

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

  const types = (Object.keys(NOTIFICATION_META) as NotificationType[])
    .filter(type => isAdmin || !NOTIFICATION_META[type].adminOnly)

  const preferences: NotificationPreferenceEntry[] = types.map((type) => {
    const meta = NOTIFICATION_META[type]
    const defaults = NOTIFICATION_DEFAULTS[type]

    return {
      type,
      label: meta.label,
      description: meta.description,
      adminOnly: meta.adminOnly,
      email: resolveChannelState(type, 'email', defaults.email, overrideMap),
      push: resolveChannelState(type, 'push', defaults.push, overrideMap),
    }
  })

  return { preferences }
}

function resolveChannelState(
  type: NotificationType,
  channel: NotificationChannel,
  defaults: { default: boolean, mandatory: boolean },
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
