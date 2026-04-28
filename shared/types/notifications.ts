export type NotificationType
  = | 'admin_registered_member'
    | 'admin_changed_member_registration'
    | 'ladv_registered'
    | 'ladv_canceled'
    | 'athlete_changed_after_ladv'
    | 'event_canceled'
    | 'event_changed'
    | 'new_event'
    | 'reminder_deadline_athlete'
    | 'reminder_deadline_admin'
    | 'reminder_event'

export type NotificationChannel = 'email' | 'push'

export interface NotificationChannelDefaults {
  default: boolean
  mandatory: boolean
}

export const NOTIFICATION_DEFAULTS: Record<NotificationType, {
  email: NotificationChannelDefaults
  push: NotificationChannelDefaults
}> = {
  admin_registered_member: { email: { default: true, mandatory: true }, push: { default: true, mandatory: false } },
  admin_changed_member_registration: { email: { default: true, mandatory: true }, push: { default: true, mandatory: false } },
  ladv_registered: { email: { default: true, mandatory: true }, push: { default: true, mandatory: false } },
  ladv_canceled: { email: { default: true, mandatory: true }, push: { default: true, mandatory: false } },
  athlete_changed_after_ladv: { email: { default: true, mandatory: true }, push: { default: true, mandatory: false } },
  event_canceled: { email: { default: true, mandatory: true }, push: { default: true, mandatory: false } },
  event_changed: { email: { default: true, mandatory: false }, push: { default: true, mandatory: false } },
  new_event: { email: { default: false, mandatory: false }, push: { default: true, mandatory: false } },
  reminder_deadline_athlete: { email: { default: true, mandatory: false }, push: { default: true, mandatory: false } },
  reminder_deadline_admin: { email: { default: true, mandatory: false }, push: { default: true, mandatory: false } },
  reminder_event: { email: { default: true, mandatory: false }, push: { default: true, mandatory: false } },
}
