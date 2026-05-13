import type { EventType, RegistrationStatus } from '~~/shared/utils/registration'
import type { RegistrationDisciplinePair } from '~~/shared/types/db'
import type { Actor } from './actor'
import { RegistrationError } from './errors'
import { VALID_INITIAL, getInitialStatus } from './state'
import { eventTypeCapabilities } from '~~/shared/utils/event-types/capabilities'

export type DeadlineAction = 'create' | 'change' | 'cancel' | 'change-wish'

export function validateInitialStatus(
  eventType: EventType,
  requested?: RegistrationStatus,
): RegistrationStatus {
  if (requested === undefined) return getInitialStatus(eventType)
  if (!VALID_INITIAL[eventType].includes(requested)) {
    throw new RegistrationError(
      'invalid_initial_status',
      `Status "${requested}" für Event-Typ "${eventType}" nicht erlaubt`,
    )
  }
  return requested
}

export function requiresWishDisciplinesForLadvMeldung(
  eventType: EventType,
  wish: RegistrationDisciplinePair[] | null | undefined,
): boolean {
  return eventTypeCapabilities[eventType].hasLadvStandManagement && (!wish || wish.length === 0)
}

export function isDeadlineEnforcedFor(
  actor: Actor,
  eventType: EventType,
  action: DeadlineAction,
): boolean {
  if (actor.kind === 'admin') return false
  if (action === 'cancel') return false
  const caps = eventTypeCapabilities[eventType]
  if (action === 'change-wish') return caps.enforcesDeadline && caps.hasWishDisciplines
  return caps.enforcesDeadline
}
