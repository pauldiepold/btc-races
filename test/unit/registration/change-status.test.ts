import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { eq } from 'drizzle-orm'
import {
  changeRegistrationStatus,
  type Actor,
  type AppDb,
  type Notifier,
} from '~~/server/registration'
import type { EventType, RegistrationStatus } from '~~/shared/utils/registration'
import type { RegistrationDisciplinePair } from '~~/shared/types/db'
import { createTestDb, type TestDb } from '../../helpers/test-db'
import { createRecorderNotifier } from '../../helpers/recorder-notifier'

let testDb: TestDb
let db: AppDb
let recorder: ReturnType<typeof createRecorderNotifier>
let notifier: Notifier

beforeEach(async () => {
  testDb = await createTestDb()
  db = testDb.db
  recorder = createRecorderNotifier()
  notifier = recorder.notifier
})

afterEach(async () => {
  await testDb.cleanup()
})

async function seedUser(opts: { emailSuffix?: string } = {}): Promise<number> {
  const { schema } = testDb
  const [user] = await testDb.db.insert(schema.users).values({
    email: `user${opts.emailSuffix ?? Date.now()}-${Math.random()}@example.com`,
    firstName: 'Test',
    lastName: 'User',
    role: 'member',
    membershipStatus: 'active',
    hasLadvStartpass: 0,
  }).returning()
  return user.id
}

type SeedEventOpts = {
  type?: EventType
  registrationDeadline?: string | null
  createdBy: number
}

async function seedEvent(opts: SeedEventOpts): Promise<number> {
  const { schema } = testDb
  const [event] = await testDb.db.insert(schema.events).values({
    type: opts.type ?? 'competition',
    name: 'Test-Event',
    date: '2026-06-01',
    registrationDeadline: opts.registrationDeadline ?? '2026-05-25',
    createdBy: opts.createdBy,
  }).returning()
  return event.id
}

type SeedRegOpts = {
  eventId: number
  userId: number
  status: RegistrationStatus
  ladvDisciplines?: RegistrationDisciplinePair[] | null
  wishDisciplines?: RegistrationDisciplinePair[]
}

async function seedRegistration(opts: SeedRegOpts): Promise<number> {
  const { schema } = testDb
  const [reg] = await testDb.db.insert(schema.registrations).values({
    eventId: opts.eventId,
    userId: opts.userId,
    status: opts.status,
    notes: null,
    wishDisciplines: opts.wishDisciplines ?? [],
    ladvDisciplines: opts.ladvDisciplines ?? null,
  }).returning()
  return reg.id
}

async function loadReg(id: number) {
  const { schema } = testDb
  return testDb.db.query.registrations.findFirst({
    where: eq(schema.registrations.id, id),
  })
}

function selfActor(userId: number): Actor {
  return { kind: 'self', userId, hasLadvStartpass: false }
}

function adminActor(userId: number): Actor {
  return { kind: 'admin', userId }
}

const LADV = [{ discipline: '100m', ageClass: 'M30' }]

describe('changeRegistrationStatus — Self', () => {
  it('LADV registered → canceled mit ladvDisciplines löst athlete_canceled_after_ladv aus', async () => {
    const userId = await seedUser()
    const eventId = await seedEvent({ type: 'ladv', createdBy: userId })
    const regId = await seedRegistration({
      eventId, userId, status: 'registered',
      wishDisciplines: LADV, ladvDisciplines: LADV,
    })

    await changeRegistrationStatus(
      { registrationId: regId, newStatus: 'canceled' },
      selfActor(userId),
      { db, notifier },
    )

    expect((await loadReg(regId))?.status).toBe('canceled')
    expect(recorder.decisions).toHaveLength(1)
    expect(recorder.decisions[0]).toMatchObject({ type: 'athlete_canceled_after_ladv' })
  })

  it('LADV registered → canceled ohne ladvDisciplines: keine Decision', async () => {
    const userId = await seedUser()
    const eventId = await seedEvent({ type: 'ladv', createdBy: userId })
    const regId = await seedRegistration({
      eventId, userId, status: 'registered',
      wishDisciplines: LADV, ladvDisciplines: null,
    })

    await changeRegistrationStatus(
      { registrationId: regId, newStatus: 'canceled' },
      selfActor(userId),
      { db, notifier },
    )

    expect(recorder.decisions).toHaveLength(0)
  })

  it('Self + silent + LADV-Cancel: athlete_canceled_after_ladv kommt trotzdem', async () => {
    const userId = await seedUser()
    const eventId = await seedEvent({ type: 'ladv', createdBy: userId })
    const regId = await seedRegistration({
      eventId, userId, status: 'registered',
      wishDisciplines: LADV, ladvDisciplines: LADV,
    })

    await changeRegistrationStatus(
      { registrationId: regId, newStatus: 'canceled' },
      selfActor(userId),
      { db, notifier },
      { silent: true },
    )

    expect(recorder.decisions).toHaveLength(1)
    expect(recorder.decisions[0]).toMatchObject({ type: 'athlete_canceled_after_ladv' })
  })

  it('Competition registered → maybe bei aktiver Frist: OK, keine Decision', async () => {
    const userId = await seedUser()
    const eventId = await seedEvent({
      type: 'competition', createdBy: userId, registrationDeadline: '2099-01-01',
    })
    const regId = await seedRegistration({ eventId, userId, status: 'registered' })

    await changeRegistrationStatus(
      { registrationId: regId, newStatus: 'maybe' },
      selfActor(userId),
      { db, notifier },
    )

    expect((await loadReg(regId))?.status).toBe('maybe')
    expect(recorder.decisions).toHaveLength(0)
  })

  it('Competition non-cancel bei abgelaufener Frist: deadline_expired', async () => {
    const userId = await seedUser()
    const eventId = await seedEvent({
      type: 'competition', createdBy: userId, registrationDeadline: '2000-01-01',
    })
    const regId = await seedRegistration({ eventId, userId, status: 'registered' })

    await expect(changeRegistrationStatus(
      { registrationId: regId, newStatus: 'maybe' },
      selfActor(userId),
      { db, notifier },
    )).rejects.toMatchObject({ code: 'deadline_expired' })
  })

  it('Competition cancel-Action bei abgelaufener Frist: bypass, OK', async () => {
    const userId = await seedUser()
    const eventId = await seedEvent({
      type: 'competition', createdBy: userId, registrationDeadline: '2000-01-01',
    })
    const regId = await seedRegistration({ eventId, userId, status: 'registered' })

    await changeRegistrationStatus(
      { registrationId: regId, newStatus: 'no' },
      selfActor(userId),
      { db, notifier },
    )

    expect((await loadReg(regId))?.status).toBe('no')
  })

  it('Invalider Übergang: invalid_status_transition', async () => {
    const userId = await seedUser()
    const eventId = await seedEvent({ type: 'ladv', createdBy: userId })
    const regId = await seedRegistration({
      eventId, userId, status: 'registered', wishDisciplines: LADV,
    })

    await expect(changeRegistrationStatus(
      { registrationId: regId, newStatus: 'maybe' },
      selfActor(userId),
      { db, notifier },
    )).rejects.toMatchObject({ code: 'invalid_status_transition' })
  })

  it('Self auf fremde Reg: forbidden', async () => {
    const ownerId = await seedUser({ emailSuffix: 'owner' })
    const otherId = await seedUser({ emailSuffix: 'other' })
    const eventId = await seedEvent({ type: 'competition', createdBy: ownerId })
    const regId = await seedRegistration({ eventId, userId: ownerId, status: 'registered' })

    await expect(changeRegistrationStatus(
      { registrationId: regId, newStatus: 'maybe' },
      selfActor(otherId),
      { db, notifier },
    )).rejects.toMatchObject({ code: 'forbidden' })
  })

  it('Nicht existierende Reg: registration_not_found', async () => {
    await expect(changeRegistrationStatus(
      { registrationId: 99999, newStatus: 'maybe' },
      selfActor(1),
      { db, notifier },
    )).rejects.toMatchObject({ code: 'registration_not_found' })
  })
})

describe('changeRegistrationStatus — Admin', () => {
  it('Admin auf fremde Reg: admin_changed_member_registration', async () => {
    const adminId = await seedUser({ emailSuffix: 'admin' })
    const memberId = await seedUser({ emailSuffix: 'member' })
    const eventId = await seedEvent({ type: 'competition', createdBy: adminId })
    const regId = await seedRegistration({ eventId, userId: memberId, status: 'registered' })

    await changeRegistrationStatus(
      { registrationId: regId, newStatus: 'no' },
      adminActor(adminId),
      { db, notifier },
    )

    expect(recorder.decisions).toHaveLength(1)
    expect(recorder.decisions[0]).toMatchObject({
      type: 'admin_changed_member_registration',
      userId: memberId,
    })
  })

  it('Admin auf fremde Reg + silent: keine Decision', async () => {
    const adminId = await seedUser({ emailSuffix: 'admin' })
    const memberId = await seedUser({ emailSuffix: 'member' })
    const eventId = await seedEvent({ type: 'competition', createdBy: adminId })
    const regId = await seedRegistration({ eventId, userId: memberId, status: 'registered' })

    await changeRegistrationStatus(
      { registrationId: regId, newStatus: 'no' },
      adminActor(adminId),
      { db, notifier },
      { silent: true },
    )

    expect(recorder.decisions).toHaveLength(0)
  })

  it('Admin auf eigene Reg: keine Decision', async () => {
    const adminId = await seedUser({ emailSuffix: 'admin' })
    const eventId = await seedEvent({ type: 'competition', createdBy: adminId })
    const regId = await seedRegistration({ eventId, userId: adminId, status: 'registered' })

    await changeRegistrationStatus(
      { registrationId: regId, newStatus: 'no' },
      adminActor(adminId),
      { db, notifier },
    )

    expect(recorder.decisions).toHaveLength(0)
  })

  it('Admin: kein Deadline-Check bei abgelaufener Frist', async () => {
    const adminId = await seedUser({ emailSuffix: 'admin' })
    const memberId = await seedUser({ emailSuffix: 'member' })
    const eventId = await seedEvent({
      type: 'competition', createdBy: adminId, registrationDeadline: '2000-01-01',
    })
    const regId = await seedRegistration({ eventId, userId: memberId, status: 'registered' })

    await changeRegistrationStatus(
      { registrationId: regId, newStatus: 'maybe' },
      adminActor(adminId),
      { db, notifier },
    )

    expect((await loadReg(regId))?.status).toBe('maybe')
  })
})

describe('changeRegistrationStatus — Mixed-Patch-Sequenz', () => {
  it('Status-Edit (non-silent) + Notes-Edit (silent) → genau eine admin_changed_member_registration', async () => {
    const { updateRegistrationNotes } = await import('~~/server/registration')

    const adminId = await seedUser({ emailSuffix: 'admin' })
    const memberId = await seedUser({ emailSuffix: 'member' })
    const eventId = await seedEvent({ type: 'competition', createdBy: adminId })
    const regId = await seedRegistration({ eventId, userId: memberId, status: 'registered' })

    await changeRegistrationStatus(
      { registrationId: regId, newStatus: 'no' },
      adminActor(adminId),
      { db, notifier },
    )
    await updateRegistrationNotes(
      { registrationId: regId, notes: 'foo' },
      adminActor(adminId),
      { db, notifier },
      { silent: true },
    )

    const adminEditDecisions = recorder.decisions.filter(
      d => d.type === 'admin_changed_member_registration',
    )
    expect(adminEditDecisions).toHaveLength(1)
  })
})
