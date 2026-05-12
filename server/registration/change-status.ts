import { isDeadlineExpired } from '~~/shared/utils/deadlines'
import type { RegistrationStatus } from '~~/shared/utils/registration'
import { assertSelfOwnsRegistration, type Actor } from './actor'
import { RegistrationError } from './errors'
import { decideLateRegistrationNotification, decideStatusChangeNotifications } from './notifications'
import {
  loadEventById,
  loadRegistrationById,
  loadUserById,
  updateRegistrationStatusField,
  type AppDb,
} from './persistence'
import { isDeadlineEnforcedFor } from './rules'
import { getValidNextStatuses } from './state'
import { dispatchNotifications } from './notifier'

export type ChangeRegistrationStatusInput = {
  registrationId: number
  newStatus: RegistrationStatus
}

export type ChangeRegistrationStatusDeps = {
  db: AppDb
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
  const { db } = deps

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

  const isLadvReactivation = dbEvent.type === 'ladv'
    && registration.status === 'canceled'
    && input.newStatus === 'registered'

  const targetUser = (decisions.length > 0 || isLadvReactivation)
    ? await loadUserById(db, registration.userId)
    : undefined

  if (isLadvReactivation && targetUser) {
    const athleteName = `${targetUser.firstName ?? ''} ${targetUser.lastName ?? ''}`.trim() || targetUser.email
    const lateDecision = decideLateRegistrationNotification(
      actor,
      dbEvent,
      athleteName,
      'reactivated',
      registration.wishDisciplines,
      now,
    )
    if (lateDecision) decisions.push(lateDecision)
  }

  if (decisions.length > 0 && targetUser) {
    await dispatchNotifications(decisions, { dbEvent, targetUser, actor, db })
  }

  return { id: registration.id }
}
