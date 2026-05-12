import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  registerMember,
  type Actor,
  type AppDb,
} from '~~/server/registration'
import type { EventType } from '~~/shared/utils/registration'
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

async function seedUser(opts: { hasLadvStartpass?: 0 | 1, role?: 'member' | 'admin', emailSuffix?: string } = {}): Promise<number> {
  const { schema } = testDb
  const [user] = await testDb.db.insert(schema.users).values({
    email: `user${opts.emailSuffix ?? Date.now()}-${Math.random()}@example.com`,
    firstName: 'Max',
    lastName: 'Mustermann',
    role: opts.role ?? 'member',
    membershipStatus: 'active',
    hasLadvStartpass: opts.hasLadvStartpass ?? 0,
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

function selfActor(userId: number, hasLadvStartpass = false): Actor {
  return { kind: 'self', userId, hasLadvStartpass }
}

function adminActor(userId: number): Actor {
  return { kind: 'admin', userId }
}

const LADV_DISCIPLINES = [{ discipline: '100m', ageClass: 'M30' }]

describe('registerMember — späte LADV-Self-Anmeldung', () => {
  it('Self-Anmeldung zu LADV innerhalb 3 Tage vor Deadline → admin_late_registration zusätzlich', async () => {
    const adminId = await seedUser({ role: 'admin', emailSuffix: 'admin' })
    const userId = await seedUser({ hasLadvStartpass: 1, emailSuffix: 'athlete' })
    const eventId = await seedEvent({ type: 'ladv', deadline: todayPlus(2), createdBy: adminId })

    await registerMember(
      { eventId, userId, wishDisciplines: LADV_DISCIPLINES },
      selfActor(userId, true),
      { db },
    )

    const jobs = await loadNotificationJobs(testDb)
    const lateJobs = jobs.filter(j => j.type === 'admin_late_registration')
    const confirmJobs = jobs.filter(j => j.type === 'registration_confirmation')
    expect(confirmJobs).toHaveLength(1)
    expect(lateJobs).toHaveLength(1)
    expect(lateJobs[0]!.payload.athleteName).toBe('Max Mustermann')
    expect(lateJobs[0]!.payload.action).toBe('registered')
    expect(lateJobs[0]!.payload.disciplines).toEqual(['100m (M30)'])
    expect(lateJobs[0]!.payload._recipients[0]?.userId).toBe(adminId)
  })

  it('Self-Anmeldung zu LADV am Deadline-Tag → admin_late_registration', async () => {
    const adminId = await seedUser({ role: 'admin', emailSuffix: 'admin' })
    const userId = await seedUser({ hasLadvStartpass: 1, emailSuffix: 'athlete' })
    const eventId = await seedEvent({ type: 'ladv', deadline: todayPlus(0), createdBy: adminId })

    await registerMember(
      { eventId, userId, wishDisciplines: LADV_DISCIPLINES },
      selfActor(userId, true),
      { db },
    )

    const jobs = await loadNotificationJobs(testDb)
    expect(jobs.some(j => j.type === 'admin_late_registration')).toBe(true)
  })

  it('Self-Anmeldung zu LADV außerhalb 3-Tage-Schwelle → KEINE admin_late_registration', async () => {
    const adminId = await seedUser({ role: 'admin', emailSuffix: 'admin' })
    const userId = await seedUser({ hasLadvStartpass: 1, emailSuffix: 'athlete' })
    const eventId = await seedEvent({ type: 'ladv', deadline: todayPlus(10), createdBy: adminId })

    await registerMember(
      { eventId, userId, wishDisciplines: LADV_DISCIPLINES },
      selfActor(userId, true),
      { db },
    )

    const jobs = await loadNotificationJobs(testDb)
    expect(jobs.filter(j => j.type === 'admin_late_registration')).toHaveLength(0)
  })

  it('Self-Anmeldung zu Competition innerhalb Schwelle → KEINE admin_late_registration', async () => {
    const adminId = await seedUser({ role: 'admin', emailSuffix: 'admin' })
    const userId = await seedUser({ emailSuffix: 'athlete' })
    const eventId = await seedEvent({ type: 'competition', deadline: todayPlus(1), createdBy: adminId })

    await registerMember({ eventId, userId }, selfActor(userId), { db })

    const jobs = await loadNotificationJobs(testDb)
    expect(jobs.filter(j => j.type === 'admin_late_registration')).toHaveLength(0)
  })

  it('Self-Anmeldung zu Training innerhalb Schwelle → KEINE admin_late_registration', async () => {
    const adminId = await seedUser({ role: 'admin', emailSuffix: 'admin' })
    const userId = await seedUser({ emailSuffix: 'athlete' })
    const eventId = await seedEvent({ type: 'training', deadline: todayPlus(1), createdBy: adminId })

    await registerMember({ eventId, userId }, selfActor(userId), { db })

    const jobs = await loadNotificationJobs(testDb)
    expect(jobs.filter(j => j.type === 'admin_late_registration')).toHaveLength(0)
  })

  it('Admin-Anmeldung zu LADV innerhalb Schwelle → KEINE admin_late_registration', async () => {
    const adminId = await seedUser({ role: 'admin', emailSuffix: 'admin' })
    const targetId = await seedUser({ hasLadvStartpass: 1, emailSuffix: 'target' })
    const eventId = await seedEvent({ type: 'ladv', deadline: todayPlus(1), createdBy: adminId })

    await registerMember(
      { eventId, userId: targetId, wishDisciplines: LADV_DISCIPLINES },
      adminActor(adminId),
      { db },
    )

    const jobs = await loadNotificationJobs(testDb)
    expect(jobs.filter(j => j.type === 'admin_late_registration')).toHaveLength(0)
  })
})
