import type { RegistrationDisciplinePair } from '~~/shared/types/db'
import { eventTypeCapabilities } from '~~/shared/utils/event-types/capabilities'
import { assertAdmin, type Actor } from './actor'
import { RegistrationError } from './errors'
import { decideLadvStandNotifications } from './notifications'
import {
  loadEventById,
  loadRegistrationById,
  loadUserById,
  updateRegistrationDisciplines,
  type AppDb,
  type RegistrationDisciplinesPatch,
} from './persistence'
import { dispatchNotifications } from './notifier'

export type SetLadvStandInput = {
  registrationId: number
  disciplines: RegistrationDisciplinePair[] | null
}

export type SetLadvStandDeps = {
  db: AppDb
}

export type SetLadvStandResult = {
  id: number
}

export async function setLadvStand(
  input: SetLadvStandInput,
  actor: Actor,
  deps: SetLadvStandDeps,
): Promise<SetLadvStandResult> {
  const { db } = deps

  assertAdmin(actor)

  const registration = await loadRegistrationById(db, input.registrationId)
  if (!registration) throw new RegistrationError('registration_not_found')

  const dbEvent = await loadEventById(db, registration.eventId)
  if (!dbEvent) throw new RegistrationError('event_not_found')

  if (!eventTypeCapabilities[dbEvent.type].hasLadvStandManagement) {
    throw new RegistrationError('not_a_ladv_event')
  }

  const patch: RegistrationDisciplinesPatch = input.disciplines !== null
    ? { ladvDisciplines: input.disciplines, wishDisciplines: input.disciplines }
    : { ladvDisciplines: null }

  const now = new Date()
  await updateRegistrationDisciplines(db, registration.id, patch, now)

  const decisions = decideLadvStandNotifications(
    registration.userId,
    input.disciplines,
    registration.ladvDisciplines,
  )

  if (decisions.length > 0) {
    const targetUser = await loadUserById(db, registration.userId)
    if (targetUser) {
      await dispatchNotifications(decisions, { dbEvent, targetUser, actor, db })
    }
  }

  return { id: registration.id }
}
