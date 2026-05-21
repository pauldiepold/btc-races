import { resolveChannelsForRecipient } from './resolve-channels'
import type { NotificationChannel, NotificationType } from '~~/shared/types/notifications'
import type { NotificationRecipient } from './recipients'

export interface DeliveryTask {
  recipient: NotificationRecipient
  channel: NotificationChannel
}

export function buildDeliveryTasks(
  type: NotificationType,
  recipients: NotificationRecipient[],
  prefsByUser: Map<number, Array<{ channel: NotificationChannel, enabled: number }>>,
  subscribedUserIds: Set<number>,
  activeUserIds: Set<number>,
): DeliveryTask[] {
  const tasks: DeliveryTask[] = []
  for (const recipient of recipients) {
    // Inaktive Mitglieder erhalten keinerlei Notifications — siehe ADR-0003.
    if (!activeUserIds.has(recipient.userId)) continue
    const userPrefs = prefsByUser.get(recipient.userId) ?? []
    const channels = resolveChannelsForRecipient(type, userPrefs)
    for (const channel of channels) {
      if (channel === 'push' && !subscribedUserIds.has(recipient.userId)) continue
      tasks.push({ recipient, channel })
    }
  }
  return tasks
}
