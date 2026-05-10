import { isDeadlineExpired } from '~~/shared/utils/deadlines'
import type { RegistrationStatus } from '~~/shared/utils/registration'
import { assertSelfOwnsRegistration, type Actor } from './actor'
import { RegistrationError } from './errors'
import { decideStatusChangeNotifications } from './notifications'
import {
  loadEventById,
  loadRegistrationById,
  loadUserById,
  updateRegistrationStatusField,
  type AppDb,
} from './persistence'
import { isDeadlineEnforcedFor } from './rules'
import { getValidNextStatuses } from './state'
import type { Notifier } from './notifier'

export type ChangeRegistrationStatusInput = {
  registrationId: number
  newStatus: RegistrationStatus
}

export type ChangeRegistrationStatusDeps = {
  db: AppDb
  notifier: Notifier
}

export type ChangeRegistrationStatusOpts = {
  silent?: boolean
}

export type ChangeRegistrationStatusResult = {
  id: number
}

export async function changeRegistrationStatus(
  input: ChangeRegistrationStatusInput,
  actor: Actor,
  deps: ChangeRegistrationStatusDeps,
  opts: ChangeRegistrationStatusOpts = {},
): Promise<ChangeRegistrationStatusResult> {
  const { db, notifier } = deps

  const registration = await loadRegistrationById(db, input.registrationId)
  if (!registration) throw new RegistrationError('registration_not_found')

  assertSelfOwnsRegistration(actor, registration)

  const dbEvent = await loadEventById(db, registration.eventId)
  if (!dbEvent) throw new RegistrationError('event_not_found')

  const validNext = getValidNextStatuses(registration.status, dbEvent.type)
  if (!validNext.includes(input.newStatus)) {
    throw new RegistrationError(
      'invalid_status_transition',
      `Statusübergang von '${registration.status}' zu '${input.newStatus}' nicht erlaubt`,
    )
  }

  const isCancelAction = input.newStatus === 'canceled' || input.newStatus === 'no'

  if (
    isDeadlineEnforcedFor(actor, dbEvent.type, isCancelAction ? 'cancel' : 'change')
    && isDeadlineExpired(dbEvent.registrationDeadline)
  ) {
    throw new RegistrationError('deadline_expired')
  }

  const now = new Date()
  await updateRegistrationStatusField(db, registration.id, input.newStatus, now)

  const decisions = decideStatusChangeNotifications(
    actor,
    registration,
    registration.status,
    input.newStatus,
    { silent: opts.silent },
  )

  if (decisions.length > 0) {
    const targetUser = await loadUserById(db, registration.userId)
    if (targetUser) {
      await notifier.dispatch(decisions, { dbEvent, targetUser, actor })
    }
  }

  return { id: registration.id }
}
