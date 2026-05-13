import { isDeadlineExpired } from '~~/shared/utils/deadlines'
import type { RegistrationDisciplinePair } from '~~/shared/types/db'
import { eventTypeCapabilities } from '~~/shared/utils/event-types/capabilities'
import type { Actor } from './actor'
import { RegistrationError } from './errors'
import { decideWishChangeNotifications } from './notifications'
import {
  loadEventById,
  loadRegistrationById,
  loadUserById,
  updateRegistrationDisciplines,
  type AppDb,
} from './persistence'
import { isDeadlineEnforcedFor } from './rules'
import { dispatchNotifications } from './notifier'

export type ChangeWishDisciplinesInput = {
  registrationId: number
  disciplines: RegistrationDisciplinePair[]
}

export type ChangeWishDisciplinesDeps = {
  db: AppDb
}

export type ChangeWishDisciplinesResult = {
  id: number
}

export async function changeWishDisciplines(
  input: ChangeWishDisciplinesInput,
  actor: Actor,
  deps: ChangeWishDisciplinesDeps,
): Promise<ChangeWishDisciplinesResult> {
  const { db } = deps

  const registration = await loadRegistrationById(db, input.registrationId)
  if (!registration) throw new RegistrationError('registration_not_found')

  if (actor.kind !== 'self' || registration.userId !== actor.userId) {
    throw new RegistrationError('forbidden')
  }

  const dbEvent = await loadEventById(db, registration.eventId)
  if (!dbEvent) throw new RegistrationError('event_not_found')

  if (!eventTypeCapabilities[dbEvent.type].hasWishDisciplines) {
    throw new RegistrationError('not_a_ladv_event')
  }

  if (input.disciplines.length === 0) {
    throw new RegistrationError('no_ladv_disciplines')
  }

  if (
    isDeadlineEnforcedFor(actor, dbEvent.type, 'change-wish')
    && isDeadlineExpired(dbEvent.registrationDeadline)
  ) {
    throw new RegistrationError('deadline_expired')
  }

  const prevWish = (registration.wishDisciplines as RegistrationDisciplinePair[] | null) ?? []
  const ladvDisciplines = registration.ladvDisciplines as RegistrationDisciplinePair[] | null

  const decisions = decideWishChangeNotifications(prevWish, input.disciplines, ladvDisciplines)

  const now = new Date()
  await updateRegistrationDisciplines(db, registration.id, { wishDisciplines: input.disciplines }, now)

  if (decisions.length > 0) {
    const targetUser = await loadUserById(db, registration.userId)
    if (targetUser) {
      await dispatchNotifications(decisions, { dbEvent, targetUser, actor, db })
    }
  }

  return { id: registration.id }
}
