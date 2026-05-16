import type { EventType, RegistrationStatus } from '~~/shared/utils/registration'
import type { RegistrationDisciplinePair } from '~~/shared/types/db'
import type { Actor } from './actor'
import { shouldNotifyAdminsOnWishChange } from '~~/shared/utils/ladv-diff'
import { isWithinDeadlineWindow } from '~~/shared/utils/deadlines'
import { eventTypeCapabilities } from '~~/shared/utils/event-types/capabilities'

export const LATE_REGISTRATION_THRESHOLD_DAYS = 3

export type NotificationDecision
  = | { type: 'registration_confirmation', userId: number }
    | { type: 'admin_registered_member', userId: number, disciplines: RegistrationDisciplinePair[] }
    | { type: 'ladv_registered', userId: number, disciplines: RegistrationDisciplinePair[] }
    | { type: 'ladv_canceled', userId: number }
    | { type: 'athlete_canceled_after_ladv' }
    | { type: 'athlete_changed_after_ladv' }
    | { type: 'admin_changed_member_registration', userId: number }
    | { type: 'admin_late_registration', athleteName: string, action: 'registered' | 'reactivated', disciplines: RegistrationDisciplinePair[] }

export function decideRegisterNotifications(
  actor: Actor,
  eventType: EventType,
  targetUserId: number,
  setLadvStand: boolean,
  wishDisciplines: RegistrationDisciplinePair[],
): NotificationDecision[] {
  if (actor.kind === 'self') {
    if (eventTypeCapabilities[eventType].hasLadvStandManagement) {
      return [{ type: 'registration_confirmation', userId: targetUserId }]
    }
    return []
  }

  if (setLadvStand && wishDisciplines.length > 0) {
    return [{ type: 'ladv_registered', userId: targetUserId, disciplines: wishDisciplines }]
  }
  return [{ type: 'admin_registered_member', userId: targetUserId, disciplines: wishDisciplines }]
}

export function decideStatusChangeNotifications(
  actor: Actor,
  registration: { userId: number, ladvDisciplines: RegistrationDisciplinePair[] | null },
  _prevStatus: RegistrationStatus,
  newStatus: RegistrationStatus,
  opts: { silent?: boolean } = {},
): NotificationDecision[] {
  const decisions: NotificationDecision[] = []
  const isCancelAction = newStatus === 'canceled' || newStatus === 'no'

  if (
    actor.kind === 'self'
    && registration.userId === actor.userId
    && isCancelAction
    && registration.ladvDisciplines !== null
  ) {
    decisions.push({ type: 'athlete_canceled_after_ladv' })
  }

  if (
    actor.kind === 'admin'
    && registration.userId !== actor.userId
    && !opts.silent
  ) {
    decisions.push({ type: 'admin_changed_member_registration', userId: registration.userId })
  }

  return decisions
}

export function decideAdminEditNotifications(
  actor: Actor,
  registration: { userId: number },
  opts: { silent?: boolean } = {},
): NotificationDecision[] {
  if (
    actor.kind === 'admin'
    && registration.userId !== actor.userId
    && !opts.silent
  ) {
    return [{ type: 'admin_changed_member_registration', userId: registration.userId }]
  }
  return []
}

export function decideWishChangeNotifications(
  prevWish: RegistrationDisciplinePair[],
  newWish: RegistrationDisciplinePair[],
  ladvDisciplines: RegistrationDisciplinePair[] | null,
): NotificationDecision[] {
  if (shouldNotifyAdminsOnWishChange(prevWish, newWish, ladvDisciplines)) {
    return [{ type: 'athlete_changed_after_ladv' }]
  }
  return []
}

export function decideLadvStandNotifications(
  targetUserId: number,
  newStand: RegistrationDisciplinePair[] | null,
): NotificationDecision[] {
  if (newStand !== null && newStand.length > 0) {
    return [{ type: 'ladv_registered', userId: targetUserId, disciplines: newStand }]
  }
  return [{ type: 'ladv_canceled', userId: targetUserId }]
}

/**
 * Späte LADV-Anmeldung: Self-Aktion an einem LADV-Event innerhalb der letzten
 * `LATE_REGISTRATION_THRESHOLD_DAYS` Tage vor Meldeschluss. Triggert Admin-Notification,
 * damit die Coaches extern bei LADV nachmelden können.
 */
export function decideLateRegistrationNotification(
  actor: Actor,
  event: { type: EventType, registrationDeadline: string | null },
  athleteName: string,
  action: 'registered' | 'reactivated',
  disciplines: RegistrationDisciplinePair[],
  now: Date = new Date(),
): NotificationDecision | null {
  if (actor.kind !== 'self') return null
  if (!eventTypeCapabilities[event.type].hasLadvStandManagement) return null
  if (!isWithinDeadlineWindow(event.registrationDeadline, LATE_REGISTRATION_THRESHOLD_DAYS, now)) return null
  return { type: 'admin_late_registration', athleteName, action, disciplines }
}
