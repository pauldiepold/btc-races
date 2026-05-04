import type { NotificationType } from '~~/shared/types/notifications'
import type { AnyNotificationDefinition } from './_define'

import { adminChangedMemberRegistration } from './admin-changed-member-registration'
import { adminRegisteredMember } from './admin-registered-member'
import { athleteCanceledAfterLadv } from './athlete-canceled-after-ladv'
import { athleteChangedAfterLadv } from './athlete-changed-after-ladv'
import { eventCanceled } from './event-canceled'
import { eventChanged } from './event-changed'
import { ladvCanceled } from './ladv-canceled'
import { ladvRegistered } from './ladv-registered'
import { newEvent } from './new-event'
import { registrationConfirmation } from './registration-confirmation'
import { reminderDeadlineAdmin } from './reminder-deadline-admin'
import { reminderDeadlineAthlete } from './reminder-deadline-athlete'
import { reminderEvent } from './reminder-event'

export type { ActorRequirement, AnyNotificationDefinition, NotificationActor, NotificationContext, NotificationDefinition, NotificationMeta, PushNotificationPayload } from './_define'
export { defineNotificationType } from './_define'

/**
 * Per-Typ-Registry. Jeder Eintrag enthält alle Informationen, um eine Notification dieses Typs
 * zu validieren, zu rendern und zuzustellen.
 */
export const notificationRegistry = {
  admin_registered_member: adminRegisteredMember,
  admin_changed_member_registration: adminChangedMemberRegistration,
  ladv_registered: ladvRegistered,
  ladv_canceled: ladvCanceled,
  registration_confirmation: registrationConfirmation,
  athlete_changed_after_ladv: athleteChangedAfterLadv,
  athlete_canceled_after_ladv: athleteCanceledAfterLadv,
  event_canceled: eventCanceled,
  event_changed: eventChanged,
  new_event: newEvent,
  reminder_deadline_athlete: reminderDeadlineAthlete,
  reminder_deadline_admin: reminderDeadlineAdmin,
  reminder_event: reminderEvent,
} as const satisfies Record<NotificationType, AnyNotificationDefinition>

export type NotificationRegistry = typeof notificationRegistry
export type NotificationDefinitionFor<T extends NotificationType> = NotificationRegistry[T]

/**
 * Alle Notification-Types in stabiler Reihenfolge (UI-Reihenfolge).
 */
export const NOTIFICATION_TYPES = Object.keys(notificationRegistry) as [NotificationType, ...NotificationType[]]

export function getNotificationDefinition<T extends NotificationType>(type: T): NotificationDefinitionFor<T> {
  return notificationRegistry[type]
}
