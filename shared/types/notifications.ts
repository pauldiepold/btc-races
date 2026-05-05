export type NotificationType
  = | 'admin_registered_member'
    | 'admin_changed_member_registration'
    | 'ladv_registered'
    | 'ladv_canceled'
    | 'registration_confirmation'
    | 'athlete_changed_after_ladv'
    | 'athlete_canceled_after_ladv'
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
