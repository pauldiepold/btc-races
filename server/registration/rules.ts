import type { EventType, RegistrationStatus } from '~~/shared/utils/registration'
import type { RegistrationDisciplinePair } from '~~/shared/types/db'
import type { Actor } from './actor'
import { RegistrationError } from './errors'
import { VALID_INITIAL, getInitialStatus } from './state'

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

export function requiresLadvDisciplines(
  eventType: EventType,
  disciplines: RegistrationDisciplinePair[] | null | undefined,
): boolean {
  return eventType === 'ladv' && (!disciplines || disciplines.length === 0)
}

export function isDeadlineEnforcedFor(
  actor: Actor,
  eventType: EventType,
  action: DeadlineAction,
): boolean {
  if (actor.kind === 'admin') return false
  if (action === 'cancel') return false
  if (action === 'change-wish') return eventType === 'ladv'
  return eventType === 'ladv' || eventType === 'competition'
}
