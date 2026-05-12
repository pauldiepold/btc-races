import { assertSelfOwnsRegistration, type Actor } from './actor'
import { RegistrationError } from './errors'
import { decideAdminEditNotifications } from './notifications'
import {
  loadEventById,
  loadRegistrationById,
  loadUserById,
  updateRegistrationNotesField,
  type AppDb,
} from './persistence'
import { dispatchNotifications } from './notifier'

export type UpdateRegistrationNotesInput = {
  registrationId: number
  notes: string | null
}

export type UpdateRegistrationNotesDeps = {
  db: AppDb
}

export type UpdateRegistrationNotesOpts = {
  silent?: boolean
}

export type UpdateRegistrationNotesResult = {
  id: number
}

export async function updateRegistrationNotes(
  input: UpdateRegistrationNotesInput,
  actor: Actor,
  deps: UpdateRegistrationNotesDeps,
  opts: UpdateRegistrationNotesOpts = {},
): Promise<UpdateRegistrationNotesResult> {
  const { db } = deps

  const registration = await loadRegistrationById(db, input.registrationId)
  if (!registration) throw new RegistrationError('registration_not_found')

  assertSelfOwnsRegistration(actor, registration)

  const now = new Date()
  await updateRegistrationNotesField(db, registration.id, input.notes, now)

  const decisions = decideAdminEditNotifications(actor, registration, { silent: opts.silent })

  if (decisions.length > 0) {
    const dbEvent = await loadEventById(db, registration.eventId)
    if (!dbEvent) throw new RegistrationError('event_not_found')
    const targetUser = await loadUserById(db, registration.userId)
    if (targetUser) {
      await dispatchNotifications(decisions, { dbEvent, targetUser, actor, db })
    }
  }

  return { id: registration.id }
}
