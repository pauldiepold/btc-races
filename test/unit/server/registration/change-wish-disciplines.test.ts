import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { eq } from 'drizzle-orm'
import {
  changeWishDisciplines,
  type Actor,
  type AppDb,
} from '~~/server/registration'
import type { EventType, RegistrationStatus } from '~~/shared/utils/registration'
import type { RegistrationDisciplinePair } from '~~/shared/types/db'
import { createTestDb, type TestDb } from '../../../helpers/test-db'
import { loadNotificationJobs } from '../../../helpers/notification-jobs'

let testDb: TestDb
let db: AppDb

beforeEach(async () => {
  testDb = await createTestDb()
  db = testDb.db
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
    type: opts.type ?? 'ladv',
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
  status?: RegistrationStatus
  wishDisciplines?: RegistrationDisciplinePair[]
  ladvDisciplines?: RegistrationDisciplinePair[] | null
}

async function seedRegistration(opts: SeedRegOpts): Promise<number> {
  const { schema } = testDb
  const [reg] = await testDb.db.insert(schema.registrations).values({
    eventId: opts.eventId,
    userId: opts.userId,
    status: opts.status ?? 'registered',
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

const D100: RegistrationDisciplinePair = { discipline: '100', ageClass: 'M30' }
const D200: RegistrationDisciplinePair = { discipline: '200', ageClass: 'M30' }

describe('changeWishDisciplines', () => {
  it('Self ändert Wunsch ohne LADV-Stand: persistiert, ladvDisciplines unverändert, keine Decision', async () => {
    const userId = await seedUser()
    const eventId = await seedEvent({ createdBy: userId, type: 'ladv' })
    const regId = await seedRegistration({ eventId, userId, wishDisciplines: [D100] })

    await changeWishDisciplines(
      { registrationId: regId, disciplines: [D100, D200] },
      selfActor(userId),
      { db },
    )

    const reg = await loadReg(regId)
    expect(reg?.wishDisciplines).toEqual([D100, D200])
    expect(reg?.ladvDisciplines).toBeNull()
    expect(await loadNotificationJobs(testDb)).toHaveLength(0)
  })

  it('Self ändert Wunsch + ladvDisciplines weicht ab → athlete_changed_after_ladv', async () => {
    const userId = await seedUser()
    const eventId = await seedEvent({ createdBy: userId, type: 'ladv' })
    const regId = await seedRegistration({
      eventId,
      userId,
      wishDisciplines: [D100],
      ladvDisciplines: [D100],
    })

    await changeWishDisciplines(
      { registrationId: regId, disciplines: [D100, D200] },
      selfActor(userId),
      { db },
    )

    const jobs = await loadNotificationJobs(testDb)
    expect(jobs).toHaveLength(1)
    expect(jobs[0]).toMatchObject({ type: 'athlete_changed_after_ladv', actorUserId: userId })
  })

  it('Self ändert Wunsch identisch zum LADV-Stand → keine Decision', async () => {
    const userId = await seedUser()
    const eventId = await seedEvent({ createdBy: userId, type: 'ladv' })
    const regId = await seedRegistration({
      eventId,
      userId,
      wishDisciplines: [D100],
      ladvDisciplines: [D100, D200],
    })

    await changeWishDisciplines(
      { registrationId: regId, disciplines: [D100, D200] },
      selfActor(userId),
      { db },
    )

    expect(await loadNotificationJobs(testDb)).toHaveLength(0)
  })

  it('Admin → forbidden', async () => {
    const adminId = await seedUser({ emailSuffix: 'admin' })
    const memberId = await seedUser({ emailSuffix: 'member' })
    const eventId = await seedEvent({ createdBy: adminId, type: 'ladv' })
    const regId = await seedRegistration({ eventId, userId: memberId })

    await expect(changeWishDisciplines(
      { registrationId: regId, disciplines: [D100] },
      adminActor(adminId),
      { db },
    )).rejects.toMatchObject({ code: 'forbidden' })
  })

  it('Self auf fremde Reg → forbidden', async () => {
    const ownerId = await seedUser({ emailSuffix: 'owner' })
    const otherId = await seedUser({ emailSuffix: 'other' })
    const eventId = await seedEvent({ createdBy: ownerId, type: 'ladv' })
    const regId = await seedRegistration({ eventId, userId: ownerId })

    await expect(changeWishDisciplines(
      { registrationId: regId, disciplines: [D100] },
      selfActor(otherId),
      { db },
    )).rejects.toMatchObject({ code: 'forbidden' })
  })

  it('Event-Typ competition → not_a_ladv_event', async () => {
    const userId = await seedUser()
    const eventId = await seedEvent({ createdBy: userId, type: 'competition' })
    const regId = await seedRegistration({ eventId, userId })

    await expect(changeWishDisciplines(
      { registrationId: regId, disciplines: [D100] },
      selfActor(userId),
      { db },
    )).rejects.toMatchObject({ code: 'not_a_ladv_event' })
  })

  it('Abgelaufene Deadline → deadline_expired', async () => {
    const userId = await seedUser()
    const eventId = await seedEvent({
      createdBy: userId,
      type: 'ladv',
      registrationDeadline: '2000-01-01',
    })
    const regId = await seedRegistration({ eventId, userId })

    await expect(changeWishDisciplines(
      { registrationId: regId, disciplines: [D100] },
      selfActor(userId),
      { db },
    )).rejects.toMatchObject({ code: 'deadline_expired' })
  })

  it('Leere Disziplinen-Liste → no_ladv_disciplines', async () => {
    const userId = await seedUser()
    const eventId = await seedEvent({ createdBy: userId, type: 'ladv' })
    const regId = await seedRegistration({ eventId, userId })

    await expect(changeWishDisciplines(
      { registrationId: regId, disciplines: [] },
      selfActor(userId),
      { db },
    )).rejects.toMatchObject({ code: 'no_ladv_disciplines' })
  })

  it('Nicht-existente Reg → registration_not_found', async () => {
    await expect(changeWishDisciplines(
      { registrationId: 99999, disciplines: [D100] },
      selfActor(1),
      { db },
    )).rejects.toMatchObject({ code: 'registration_not_found' })
  })
})
