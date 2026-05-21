import { isDeadlineExpired } from '~~/shared/utils/deadlines'
import type { RegistrationDisciplinePair } from '~~/shared/types/db'
import type { RegistrationStatus } from '~~/shared/utils/registration'
import { eventTypeCapabilities } from '~~/shared/utils/event-types/capabilities'
import type { Actor } from './actor'
import { RegistrationError } from './errors'
import { decideLateRegistrationNotification, decideRegisterNotifications } from './notifications'
import {
  insertRegistration,
  loadEventById,
  loadRegistrationByEventUser,
  loadUserById,
  reactivateRegistration,
  type AppDb,
} from './persistence'
import { isDeadlineEnforcedFor, requiresWishDisciplinesForLadvMeldung, validateInitialStatus } from './rules'
import { dispatchNotifications } from './notifier'

export type RegisterMemberInput = {
  eventId: number
  userId: number
  status?: RegistrationStatus
  notes?: string
  wishDisciplines?: RegistrationDisciplinePair[]
  setLadvStandImmediately?: boolean
}

export type RegisterMemberDeps = {
  db: AppDb
}

export type RegisterMemberResult = {
  id: number
  reactivated: boolean
}

export async function registerMember(
  input: RegisterMemberInput,
  actor: Actor,
  deps: RegisterMemberDeps,
): Promise<RegisterMemberResult> {
  const { db } = deps

  // 1. Self-Owner-Check
  if (actor.kind === 'self' && input.userId !== actor.userId) {
    throw new RegistrationError('forbidden')
  }

  // 2. Event laden
  const dbEvent = await loadEventById(db, input.eventId)
  if (!dbEvent) throw new RegistrationError('event_not_found')
  if (dbEvent.cancelledAt) throw new RegistrationError('event_canceled')

  // 3. Target-User laden (immer, für Notifications + Startpass-Check)
  const targetUser = await loadUserById(db, input.userId)
  if (!targetUser) throw new RegistrationError('member_not_found')
  if (actor.kind === 'admin' && targetUser.membershipStatus !== 'active') {
    throw new RegistrationError('inactive_member')
  }

  // 4. Existing-Lookup vor Deadline, damit aktiv Angemeldete den präziseren
  // already_registered-Fehler bekommen statt deadline_expired.
  const existing = await loadRegistrationByEventUser(db, input.eventId, input.userId)
  if (existing && existing.status !== 'canceled') {
    throw new RegistrationError('already_registered')
  }

  // 5. Deadline
  if (isDeadlineEnforcedFor(actor, dbEvent.type, 'create')
    && isDeadlineExpired(dbEvent.registrationDeadline)) {
    throw new RegistrationError('deadline_expired')
  }

  const caps = eventTypeCapabilities[dbEvent.type]

  // 6. LADV-Startpass am Target prüfen
  if (caps.hasLadvStandManagement && targetUser.hasLadvStartpass !== 1) {
    throw new RegistrationError('no_ladv_startpass')
  }

  // 7. Wunsch-Disziplinen für LADV-Meldung erforderlich
  if (requiresWishDisciplinesForLadvMeldung(dbEvent.type, input.wishDisciplines)) {
    throw new RegistrationError('no_ladv_disciplines')
  }

  // 8. Status-Validierung (wirft invalid_initial_status)
  const status = validateInitialStatus(dbEvent.type, input.status)

  // 9. Daten ableiten
  const wishDisciplines: RegistrationDisciplinePair[]
    = caps.hasWishDisciplines ? input.wishDisciplines! : []
  const setLadv = input.setLadvStandImmediately === true
    && actor.kind === 'admin'
    && caps.hasLadvStandManagement

  // 10. Persistieren — bei Reaktivierung bleibt ladvDisciplines bewusst stehen,
  // sofern setLadv nicht gesetzt ist: der LADV-Stand wird ausschließlich vom Coach
  // gepflegt, nicht durch Self-Cancel/Reaktivierung.
  const now = new Date()
  let registrationId: number
  let reactivated: boolean

  if (existing) {
    await reactivateRegistration(db, existing.id, {
      status,
      notes: input.notes ?? null,
      wishDisciplines,
      ...(setLadv ? { ladvDisciplines: wishDisciplines } : {}),
      now,
    })
    registrationId = existing.id
    reactivated = true
  }
  else {
    registrationId = await insertRegistration(db, {
      eventId: input.eventId,
      userId: input.userId,
      status,
      notes: input.notes ?? null,
      wishDisciplines,
      ladvDisciplines: setLadv ? wishDisciplines : null,
      now,
    })
    reactivated = false
  }

  // 11. Notifications
  const decisions = decideRegisterNotifications(
    actor,
    dbEvent.type,
    targetUser.id,
    setLadv,
    wishDisciplines,
    existing ? existing.ladvDisciplines : null,
  )

  const athleteName = `${targetUser.firstName ?? ''} ${targetUser.lastName ?? ''}`.trim() || targetUser.email
  const lateDecision = decideLateRegistrationNotification(
    actor,
    dbEvent,
    athleteName,
    'registered',
    wishDisciplines,
    now,
  )
  if (lateDecision) decisions.push(lateDecision)

  await dispatchNotifications(decisions, {
    dbEvent,
    targetUser,
    actor,
    db,
  })

  return { id: registrationId, reactivated }
}
