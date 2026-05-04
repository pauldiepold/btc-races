import type { NotificationChannel, NotificationType } from '~~/shared/types/notifications'
import { getNotificationDefinition } from './registry'

/**
 * Bestimmt die aktiven Kanäle für einen Empfänger + Notification-Typ.
 *
 * Reihenfolge:
 * 1. mandatory → immer aktiv (User kann nicht opt-out)
 * 2. Explizite User-Preference → nutzen
 * 3. Sonst → Default aus der Registry
 */
export function resolveChannelsForRecipient(
  type: NotificationType,
  userPreferences: Array<{ channel: NotificationChannel, enabled: number }>,
): NotificationChannel[] {
  const defaults = getNotificationDefinition(type).defaults
  const channels: NotificationChannel[] = []

  for (const ch of ['email', 'push'] as const) {
    const def = defaults[ch]

    if (def.mandatory) {
      channels.push(ch)
      continue
    }

    const pref = userPreferences.find(p => p.channel === ch)
    const enabled = pref ? pref.enabled === 1 : def.default

    if (enabled) {
      channels.push(ch)
    }
  }

  return channels
}
