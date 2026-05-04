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
): DeliveryTask[] {
  const tasks: DeliveryTask[] = []
  for (const recipient of recipients) {
    const userPrefs = prefsByUser.get(recipient.userId) ?? []
    const channels = resolveChannelsForRecipient(type, userPrefs)
    for (const channel of channels) {
      if (channel === 'push' && !subscribedUserIds.has(recipient.userId)) continue
      tasks.push({ recipient, channel })
    }
  }
  return tasks
}
