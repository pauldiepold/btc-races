import type { NotificationType, NotificationChannel } from '~~/shared/types/notifications'

export type { NotificationType, NotificationChannel }

export interface NotificationRecipient {
  userId: number
  email?: string
  firstName?: string
  disciplines?: string[]
}

export interface SendNotificationOptions {
  type: NotificationType
  recipients: NotificationRecipient[] | 'all_admins' | 'all_members'
  payload: Record<string, unknown>
  eventId?: number
}

export interface SendNotificationResult {
  jobId: number
}
