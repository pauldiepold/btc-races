import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  changeRegistrationStatus,
  type Actor,
  type AppDb,
} from '~~/server/registration'
import type { EventType } from '~~/shared/utils/registration'
import type { RegistrationDisciplinePair } from '~~/shared/types/db'
import { createTestDb, type TestDb } from '../../helpers/test-db'
import { loadNotificationJobs } from '../../helpers/notification-jobs'

let testDb: TestDb
let db: AppDb

beforeEach(async () => {
  testDb = await createTestDb()
  db = testDb.db
})

afterEach(async () => {
  await testDb.cleanup()
})

const berlinDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' })

function todayPlus(days: number): string {
  const d = new Date(Date.now() + days * 86_400_000)
  return berlinDate.format(d)
}

async function seedUser(opts: { role?: 'member' | 'admin', emailSuffix?: string } = {}): Promise<number> {
  const { schema } = testDb
  const [user] = await testDb.db.insert(schema.users).values({
    email: `user${opts.emailSuffix ?? Date.now()}-${Math.random()}@example.com`,
    firstName: 'Max',
    lastName: 'Mustermann',
    role: opts.role ?? 'member',
    membershipStatus: 'active',
    hasLadvStartpass: 0,
  }).returning()
  return user.id
}

async function seedEvent(opts: { type: EventType, deadline: string, createdBy: number }): Promise<number> {
  const { schema } = testDb
  const [event] = await testDb.db.insert(schema.events).values({
    type: opts.type,
    name: 'Test-Event',
    date: todayPlus(30),
    registrationDeadline: opts.deadline,
    createdBy: opts.createdBy,
  }).returning()
  return event.id
}

async function seedRegistration(opts: {
  eventId: number
  userId: number
  status: 'canceled' | 'registered'
  wishDisciplines?: RegistrationDisciplinePair[]
}): Promise<number> {
  const { schema } = testDb
  const [reg] = await testDb.db.insert(schema.registrations).values({
    eventId: opts.eventId,
    userId: opts.userId,
    status: opts.status,
    wishDisciplines: opts.wishDisciplines ?? [],
  }).returning()
  return reg.id
}

function selfActor(userId: number): Actor {
  return { kind: 'self', userId, hasLadvStartpass: false }
}

function adminActor(userId: number): Actor {
  return { kind: 'admin', userId }
}

const LADV = [{ discipline: '100m', ageClass: 'M30' }]

describe('changeRegistrationStatus — späte LADV-Reaktivierung', () => {
  it('Self canceled→registered bei LADV innerhalb 3 Tage → admin_late_registration', async () => {
    const adminId = await seedUser({ role: 'admin', emailSuffix: 'admin' })
    const userId = await seedUser({ emailSuffix: 'athlete' })
    const eventId = await seedEvent({ type: 'ladv', deadline: todayPlus(2), createdBy: adminId })
    const regId = await seedRegistration({ eventId, userId, status: 'canceled', wishDisciplines: LADV })

    await changeRegistrationStatus(
      { registrationId: regId, newStatus: 'registered' },
      selfActor(userId),
      { db },
    )

    const jobs = await loadNotificationJobs(testDb)
    const lateJobs = jobs.filter(j => j.type === 'admin_late_registration')
    expect(lateJobs).toHaveLength(1)
    expect(lateJobs[0]!.payload.action).toBe('reactivated')
    expect(lateJobs[0]!.payload.athleteName).toBe('Max Mustermann')
    expect(lateJobs[0]!.payload.disciplines).toEqual(['100m (M30)'])
    expect(lateJobs[0]!.payload._recipients[0]?.userId).toBe(adminId)
  })

  it('Self canceled→registered bei LADV außerhalb Schwelle → KEINE admin_late_registration', async () => {
    const adminId = await seedUser({ role: 'admin', emailSuffix: 'admin' })
    const userId = await seedUser({ emailSuffix: 'athlete' })
    const eventId = await seedEvent({ type: 'ladv', deadline: todayPlus(10), createdBy: adminId })
    const regId = await seedRegistration({ eventId, userId, status: 'canceled', wishDisciplines: LADV })

    await changeRegistrationStatus(
      { registrationId: regId, newStatus: 'registered' },
      selfActor(userId),
      { db },
    )

    const jobs = await loadNotificationJobs(testDb)
    expect(jobs.filter(j => j.type === 'admin_late_registration')).toHaveLength(0)
  })

  it('Self registered→canceled bei LADV innerhalb Schwelle → KEINE admin_late_registration', async () => {
    const adminId = await seedUser({ role: 'admin', emailSuffix: 'admin' })
    const userId = await seedUser({ emailSuffix: 'athlete' })
    const eventId = await seedEvent({ type: 'ladv', deadline: todayPlus(2), createdBy: adminId })
    const regId = await seedRegistration({ eventId, userId, status: 'registered', wishDisciplines: LADV })

    await changeRegistrationStatus(
      { registrationId: regId, newStatus: 'canceled' },
      selfActor(userId),
      { db },
    )

    const jobs = await loadNotificationJobs(testDb)
    expect(jobs.filter(j => j.type === 'admin_late_registration')).toHaveLength(0)
  })

  it('Admin canceled→registered bei LADV innerhalb Schwelle → KEINE admin_late_registration', async () => {
    const adminId = await seedUser({ role: 'admin', emailSuffix: 'admin' })
    const targetId = await seedUser({ emailSuffix: 'target' })
    const eventId = await seedEvent({ type: 'ladv', deadline: todayPlus(2), createdBy: adminId })
    const regId = await seedRegistration({ eventId, userId: targetId, status: 'canceled', wishDisciplines: LADV })

    await changeRegistrationStatus(
      { registrationId: regId, newStatus: 'registered' },
      adminActor(adminId),
      { db },
    )

    const jobs = await loadNotificationJobs(testDb)
    expect(jobs.filter(j => j.type === 'admin_late_registration')).toHaveLength(0)
  })
})
