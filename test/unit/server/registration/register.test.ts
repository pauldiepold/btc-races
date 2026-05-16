import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { eq } from 'drizzle-orm'
import {
  RegistrationError,
  registerMember,
  type Actor,
  type AppDb,
  type RegisterMemberInput,
} from '~~/server/registration'
import type { EventType } from '~~/shared/utils/registration'
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

type SeedUserOpts = {
  hasLadvStartpass?: 0 | 1
  membershipStatus?: 'active' | 'inactive'
  emailSuffix?: string
}

async function seedUser(opts: SeedUserOpts = {}): Promise<number> {
  const { schema } = testDb
  const [user] = await testDb.db.insert(schema.users).values({
    email: `user${opts.emailSuffix ?? Date.now()}-${Math.random()}@example.com`,
    firstName: 'Test',
    lastName: 'User',
    role: 'member',
    membershipStatus: opts.membershipStatus ?? 'active',
    hasLadvStartpass: opts.hasLadvStartpass ?? 0,
  }).returning()
  return user.id
}

type SeedEventOpts = {
  type?: EventType
  registrationDeadline?: string | null
  cancelled?: boolean
  createdBy: number
}

async function seedEvent(opts: SeedEventOpts): Promise<number> {
  const { schema } = testDb
  const [event] = await testDb.db.insert(schema.events).values({
    type: opts.type ?? 'ladv',
    name: 'Test-Event',
    date: '2026-06-01',
    registrationDeadline: opts.registrationDeadline ?? '2026-05-25',
    cancelledAt: opts.cancelled ? new Date() : null,
    createdBy: opts.createdBy,
  }).returning()
  return event.id
}

async function loadRegistration(id: number) {
  const { schema } = testDb
  return testDb.db.query.registrations.findFirst({
    where: eq(schema.registrations.id, id),
  })
}

function selfActor(userId: number, hasLadvStartpass = false): Actor {
  return { kind: 'self', userId, hasLadvStartpass }
}

function adminActor(userId: number): Actor {
  return { kind: 'admin', userId }
}

const LADV_DISCIPLINES = [{ discipline: '100m', ageClass: 'M30' }]

function input(partial: Partial<RegisterMemberInput> & { eventId: number, userId: number }): RegisterMemberInput {
  return partial
}

describe('registerMember — Self-Anmeldung', () => {
  it('LADV: legt Anmeldung an + sendet registration_confirmation', async () => {
    const userId = await seedUser({ hasLadvStartpass: 1 })
    const eventId = await seedEvent({ type: 'ladv', createdBy: userId })

    const result = await registerMember(
      input({ eventId, userId, wishDisciplines: LADV_DISCIPLINES }),
      selfActor(userId, true),
      { db },
    )

    expect(result.reactivated).toBe(false)
    const reg = await loadRegistration(result.id)
    expect(reg?.status).toBe('registered')
    expect(reg?.wishDisciplines).toEqual(LADV_DISCIPLINES)
    expect(reg?.ladvDisciplines).toBeNull()

    const jobs = await loadNotificationJobs(testDb)
    expect(jobs).toHaveLength(1)
    expect(jobs[0]).toMatchObject({ type: 'registration_confirmation' })
    expect(jobs[0]!.payload._recipients[0]?.userId).toBe(userId)
    expect(jobs[0]!.payload.eventName).toBe('Test-Event')
  })

  it('Competition: Initialstatus registered, keine Notification', async () => {
    const userId = await seedUser()
    const eventId = await seedEvent({ type: 'competition', createdBy: userId })

    const result = await registerMember(input({ eventId, userId }), selfActor(userId), { db })

    const reg = await loadRegistration(result.id)
    expect(reg?.status).toBe('registered')
    expect(reg?.wishDisciplines).toEqual([])
    expect(await loadNotificationJobs(testDb)).toHaveLength(0)
  })

  it('Training: Initialstatus yes, keine Notification', async () => {
    const userId = await seedUser()
    const eventId = await seedEvent({ type: 'training', createdBy: userId })

    const result = await registerMember(input({ eventId, userId }), selfActor(userId), { db })

    const reg = await loadRegistration(result.id)
    expect(reg?.status).toBe('yes')
    expect(await loadNotificationJobs(testDb)).toHaveLength(0)
  })
})

describe('registerMember — Admin-Anmeldung', () => {
  it('LADV ohne setLadv: admin_registered_member mit Disziplinen', async () => {
    const adminId = await seedUser({ emailSuffix: 'admin' })
    const targetId = await seedUser({ emailSuffix: 'target', hasLadvStartpass: 1 })
    const eventId = await seedEvent({ type: 'ladv', createdBy: adminId })

    const result = await registerMember(
      input({ eventId, userId: targetId, wishDisciplines: LADV_DISCIPLINES }),
      adminActor(adminId),
      { db },
    )

    const reg = await loadRegistration(result.id)
    expect(reg?.status).toBe('registered')
    expect(reg?.wishDisciplines).toEqual(LADV_DISCIPLINES)
    expect(reg?.ladvDisciplines).toBeNull()

    const jobs = await loadNotificationJobs(testDb)
    expect(jobs).toHaveLength(1)
    expect(jobs[0]).toMatchObject({ type: 'admin_registered_member', actorUserId: adminId })
    expect(jobs[0]!.payload._recipients[0]?.userId).toBe(targetId)
    expect(jobs[0]!.payload.disciplines).toEqual(['100m (M30)'])
  })

  it('LADV mit setLadv: ladv_registered, ladvDisciplines gesetzt', async () => {
    const adminId = await seedUser({ emailSuffix: 'admin' })
    const targetId = await seedUser({ emailSuffix: 'target', hasLadvStartpass: 1 })
    const eventId = await seedEvent({ type: 'ladv', createdBy: adminId })

    const result = await registerMember(
      input({
        eventId,
        userId: targetId,
        wishDisciplines: LADV_DISCIPLINES,
        setLadvStandImmediately: true,
      }),
      adminActor(adminId),
      { db },
    )

    const reg = await loadRegistration(result.id)
    expect(reg?.ladvDisciplines).toEqual(LADV_DISCIPLINES)

    const jobs = await loadNotificationJobs(testDb)
    expect(jobs).toHaveLength(1)
    expect(jobs[0]).toMatchObject({ type: 'ladv_registered', actorUserId: adminId })
    expect(jobs[0]!.payload._recipients[0]?.userId).toBe(targetId)
    expect(jobs[0]!.payload.disciplines).toEqual(['100m (M30)'])
  })

  it('Competition: admin_registered_member ohne disciplines', async () => {
    const adminId = await seedUser({ emailSuffix: 'admin' })
    const targetId = await seedUser({ emailSuffix: 'target' })
    const eventId = await seedEvent({ type: 'competition', createdBy: adminId })

    await registerMember(input({ eventId, userId: targetId }), adminActor(adminId), { db })

    const jobs = await loadNotificationJobs(testDb)
    expect(jobs).toHaveLength(1)
    expect(jobs[0]).toMatchObject({ type: 'admin_registered_member', actorUserId: adminId })
    expect(jobs[0]!.payload._recipients[0]?.userId).toBe(targetId)
    expect(jobs[0]!.payload.disciplines).toBeUndefined()
  })
})

describe('registerMember — Reaktivierung', () => {
  it('Self reaktiviert eigene canceled-Anmeldung (Bug-Fix)', async () => {
    const userId = await seedUser({ hasLadvStartpass: 1 })
    const eventId = await seedEvent({ type: 'ladv', createdBy: userId })
    const { schema } = testDb

    const [pre] = await testDb.db.insert(schema.registrations).values({
      eventId,
      userId,
      status: 'canceled',
      wishDisciplines: [],
    }).returning()

    const result = await registerMember(
      input({ eventId, userId, wishDisciplines: LADV_DISCIPLINES }),
      selfActor(userId, true),
      { db },
    )

    expect(result.id).toBe(pre.id)
    expect(result.reactivated).toBe(true)

    const reg = await loadRegistration(result.id)
    expect(reg?.status).toBe('registered')
    expect(reg?.wishDisciplines).toEqual(LADV_DISCIPLINES)

    const jobs = await loadNotificationJobs(testDb)
    expect(jobs).toHaveLength(1)
    expect(jobs[0]?.type).toBe('registration_confirmation')
  })

  it('Admin reaktiviert canceled-Anmeldung', async () => {
    const adminId = await seedUser({ emailSuffix: 'admin' })
    const targetId = await seedUser({ emailSuffix: 'target', hasLadvStartpass: 1 })
    const eventId = await seedEvent({ type: 'ladv', createdBy: adminId })
    const { schema } = testDb

    const [pre] = await testDb.db.insert(schema.registrations).values({
      eventId,
      userId: targetId,
      status: 'canceled',
      wishDisciplines: [],
    }).returning()

    const result = await registerMember(
      input({ eventId, userId: targetId, wishDisciplines: LADV_DISCIPLINES }),
      adminActor(adminId),
      { db },
    )

    expect(result.id).toBe(pre.id)
    expect(result.reactivated).toBe(true)
    const reg = await loadRegistration(result.id)
    expect(reg?.status).toBe('registered')
  })
})

describe('registerMember — Bug-Fix: strikte Status-Validierung', () => {
  it('LADV mit status=maybe → invalid_initial_status', async () => {
    const userId = await seedUser({ hasLadvStartpass: 1 })
    const eventId = await seedEvent({ type: 'ladv', createdBy: userId })

    await expect(
      registerMember(
        input({ eventId, userId, status: 'maybe', wishDisciplines: LADV_DISCIPLINES }),
        selfActor(userId, true),
        { db },
      ),
    ).rejects.toMatchObject({ code: 'invalid_initial_status' })
  })
})

describe('registerMember — LADV-Startpass-Pflicht', () => {
  it('Bug-Fix: Admin-LADV-Anmeldung ohne Target-Startpass → no_ladv_startpass', async () => {
    const adminId = await seedUser({ emailSuffix: 'admin', hasLadvStartpass: 1 })
    const targetId = await seedUser({ emailSuffix: 'target', hasLadvStartpass: 0 })
    const eventId = await seedEvent({ type: 'ladv', createdBy: adminId })

    await expect(
      registerMember(
        input({ eventId, userId: targetId, wishDisciplines: LADV_DISCIPLINES }),
        adminActor(adminId),
        { db },
      ),
    ).rejects.toMatchObject({ code: 'no_ladv_startpass' })
  })

  it('Self-LADV-Anmeldung ohne Startpass → no_ladv_startpass', async () => {
    const userId = await seedUser({ hasLadvStartpass: 0 })
    const eventId = await seedEvent({ type: 'ladv', createdBy: userId })

    await expect(
      registerMember(
        input({ eventId, userId, wishDisciplines: LADV_DISCIPLINES }),
        selfActor(userId, false),
        { db },
      ),
    ).rejects.toMatchObject({ code: 'no_ladv_startpass' })
  })
})

describe('registerMember — Deadline', () => {
  it('Self LADV nach abgelaufener Deadline → deadline_expired', async () => {
    const userId = await seedUser({ hasLadvStartpass: 1 })
    const eventId = await seedEvent({
      type: 'ladv',
      registrationDeadline: '2020-01-01',
      createdBy: userId,
    })

    await expect(
      registerMember(
        input({ eventId, userId, wishDisciplines: LADV_DISCIPLINES }),
        selfActor(userId, true),
        { db },
      ),
    ).rejects.toMatchObject({ code: 'deadline_expired' })
  })

  it('Admin LADV nach abgelaufener Deadline → erfolgreich (Bypass)', async () => {
    const adminId = await seedUser({ emailSuffix: 'admin' })
    const targetId = await seedUser({ emailSuffix: 'target', hasLadvStartpass: 1 })
    const eventId = await seedEvent({
      type: 'ladv',
      registrationDeadline: '2020-01-01',
      createdBy: adminId,
    })

    const result = await registerMember(
      input({ eventId, userId: targetId, wishDisciplines: LADV_DISCIPLINES }),
      adminActor(adminId),
      { db },
    )
    expect(result.reactivated).toBe(false)
  })
})

describe('registerMember — Mitgliedschaft & Duplikate', () => {
  it('Admin: inaktives Target → inactive_member', async () => {
    const adminId = await seedUser({ emailSuffix: 'admin' })
    const targetId = await seedUser({ emailSuffix: 'target', membershipStatus: 'inactive' })
    const eventId = await seedEvent({ type: 'training', createdBy: adminId })

    await expect(
      registerMember(input({ eventId, userId: targetId }), adminActor(adminId), { db }),
    ).rejects.toMatchObject({ code: 'inactive_member' })
  })

  it('aktiv angemeldet → already_registered', async () => {
    const userId = await seedUser({ hasLadvStartpass: 1 })
    const eventId = await seedEvent({ type: 'ladv', createdBy: userId })
    const { schema } = testDb
    await testDb.db.insert(schema.registrations).values({
      eventId,
      userId,
      status: 'registered',
      wishDisciplines: LADV_DISCIPLINES,
    })

    await expect(
      registerMember(
        input({ eventId, userId, wishDisciplines: LADV_DISCIPLINES }),
        selfActor(userId, true),
        { db },
      ),
    ).rejects.toMatchObject({ code: 'already_registered' })
  })

  it('Self mit fremdem userId → forbidden', async () => {
    const userId = await seedUser({ emailSuffix: 'me' })
    const otherId = await seedUser({ emailSuffix: 'other' })
    const eventId = await seedEvent({ type: 'training', createdBy: userId })

    await expect(
      registerMember(input({ eventId, userId: otherId }), selfActor(userId), { db }),
    ).rejects.toBeInstanceOf(RegistrationError)
  })
})
