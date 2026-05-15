import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { eq } from 'drizzle-orm'
import {
  cancelEvent,
  type AppDb,
  type EventActor,
} from '~~/server/events'
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

const FUTURE_DATE = '2099-06-01'

async function seedUser(opts: { role?: 'member' | 'admin' | 'superuser', suffix?: string } = {}): Promise<number> {
  const { schema } = testDb
  const [user] = await testDb.db.insert(schema.users).values({
    email: `user${opts.suffix ?? Date.now()}-${Math.random()}@example.com`,
    firstName: 'Test',
    lastName: 'User',
    role: opts.role ?? 'member',
    membershipStatus: 'active',
    hasLadvStartpass: 0,
  }).returning()
  return user.id
}

async function seedEvent(opts: { createdBy: number, cancelledAt?: Date | null }): Promise<number> {
  const { schema } = testDb
  const [event] = await testDb.db.insert(schema.events).values({
    type: 'competition',
    name: 'Test-Event',
    date: FUTURE_DATE,
    cancelledAt: opts.cancelledAt ?? null,
    createdBy: opts.createdBy,
  }).returning()
  return event.id
}

async function seedAttendee(eventId: number, status: 'registered' | 'yes' | 'maybe' | 'no' | 'canceled' = 'registered'): Promise<number> {
  const { schema } = testDb
  const userId = await seedUser({ suffix: `attendee-${Math.random()}` })
  await testDb.db.insert(schema.registrations).values({
    eventId,
    userId,
    status,
    notes: null,
    wishDisciplines: [],
    ladvDisciplines: null,
  })
  return userId
}

async function loadEvent(id: number) {
  const { schema } = testDb
  return testDb.db.query.events.findFirst({ where: eq(schema.events.id, id) })
}

function ownerActor(userId: number): EventActor {
  return { kind: 'owner', userId }
}

function adminActor(userId: number, isSuperuser = false): EventActor {
  return { kind: 'admin', userId, isSuperuser }
}

describe('cancelEvent', () => {
  it('Owner cancelt eigenes Event → cancelledAt gesetzt + Notification an registered/yes/maybe', async () => {
    const ownerId = await seedUser()
    const eventId = await seedEvent({ createdBy: ownerId })
    const a1 = await seedAttendee(eventId, 'registered')
    const a2 = await seedAttendee(eventId, 'yes')
    const a3 = await seedAttendee(eventId, 'maybe')
    await seedAttendee(eventId, 'no')
    await seedAttendee(eventId, 'canceled')

    const result = await cancelEvent(eventId, ownerActor(ownerId), { db })

    expect(result.cancelled).toBe(true)
    expect((await loadEvent(eventId))?.cancelledAt).toBeTruthy()

    const jobs = await loadNotificationJobs(testDb)
    expect(jobs).toHaveLength(1)
    expect(jobs[0]).toMatchObject({ type: 'event_canceled', actorUserId: ownerId })
    const recipientIds = jobs[0].payload._recipients.map(r => r.userId).sort()
    expect(recipientIds).toEqual([a1, a2, a3].sort())
  })

  it('Zweiter Cancel ist idempotent → kein zweiter Job, kein DB-Write', async () => {
    const ownerId = await seedUser()
    const eventId = await seedEvent({ createdBy: ownerId })
    await seedAttendee(eventId, 'registered')

    await cancelEvent(eventId, ownerActor(ownerId), { db })
    const firstCancelledAt = (await loadEvent(eventId))?.cancelledAt

    const result = await cancelEvent(eventId, ownerActor(ownerId), { db })

    expect(result.cancelled).toBe(false)
    expect((await loadEvent(eventId))?.cancelledAt).toEqual(firstCancelledAt)

    const jobs = await loadNotificationJobs(testDb)
    expect(jobs).toHaveLength(1)
  })

  it('Owner darf fremdes Event NICHT canceln → forbidden', async () => {
    const ownerId = await seedUser({ suffix: 'owner' })
    const strangerId = await seedUser({ suffix: 'stranger' })
    const eventId = await seedEvent({ createdBy: ownerId })

    await expect(
      cancelEvent(eventId, ownerActor(strangerId), { db }),
    ).rejects.toMatchObject({ code: 'forbidden' })

    expect((await loadEvent(eventId))?.cancelledAt).toBeNull()
    expect(await loadNotificationJobs(testDb)).toHaveLength(0)
  })

  it('Admin darf fremdes Event canceln', async () => {
    const ownerId = await seedUser({ suffix: 'owner' })
    const adminId = await seedUser({ role: 'admin', suffix: 'admin' })
    const eventId = await seedEvent({ createdBy: ownerId })
    await seedAttendee(eventId, 'registered')

    const result = await cancelEvent(eventId, adminActor(adminId), { db })

    expect(result.cancelled).toBe(true)
    expect((await loadEvent(eventId))?.cancelledAt).toBeTruthy()

    const jobs = await loadNotificationJobs(testDb)
    expect(jobs).toHaveLength(1)
    expect(jobs[0].actorUserId).toBe(adminId)
  })

  it('Leere Recipient-Liste → kein Job, Cancel läuft trotzdem', async () => {
    const adminId = await seedUser({ role: 'admin' })
    const eventId = await seedEvent({ createdBy: adminId })

    await cancelEvent(eventId, adminActor(adminId), { db })

    expect((await loadEvent(eventId))?.cancelledAt).toBeTruthy()
    expect(await loadNotificationJobs(testDb)).toHaveLength(0)
  })

  it('Recipients mit Status no/canceled werden ausgespart', async () => {
    const adminId = await seedUser({ role: 'admin' })
    const eventId = await seedEvent({ createdBy: adminId })
    await seedAttendee(eventId, 'no')
    await seedAttendee(eventId, 'canceled')

    await cancelEvent(eventId, adminActor(adminId), { db })

    expect(await loadNotificationJobs(testDb)).toHaveLength(0)
  })

  it('Unbekanntes Event → event_not_found', async () => {
    const adminId = await seedUser({ role: 'admin' })

    await expect(
      cancelEvent(99999, adminActor(adminId), { db }),
    ).rejects.toMatchObject({ code: 'event_not_found' })
  })
})
