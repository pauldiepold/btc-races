import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { eq } from 'drizzle-orm'
import {
  uncancelEvent,
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

async function seedEvent(opts: { createdBy: number, cancelledAt?: Date | null, cancelReason?: string | null }): Promise<number> {
  const { schema } = testDb
  const [event] = await testDb.db.insert(schema.events).values({
    type: 'competition',
    name: 'Test-Event',
    date: FUTURE_DATE,
    cancelledAt: opts.cancelledAt ?? null,
    cancelReason: opts.cancelReason ?? null,
    createdBy: opts.createdBy,
  }).returning()
  return event.id
}

async function loadEvent(id: number) {
  const { schema } = testDb
  return testDb.db.query.events.findFirst({ where: eq(schema.events.id, id) })
}

function selfActor(userId: number): EventActor {
  return { kind: 'self', userId }
}

function adminActor(userId: number): EventActor {
  return { kind: 'admin', userId }
}

describe('uncancelEvent', () => {
  it('Owner reaktiviert eigenes abgesagtes Event → cancelledAt := null, keine Notification', async () => {
    const ownerId = await seedUser()
    const eventId = await seedEvent({ createdBy: ownerId, cancelledAt: new Date() })

    const result = await uncancelEvent(eventId, selfActor(ownerId), { db })

    expect(result.uncancelled).toBe(true)
    expect((await loadEvent(eventId))?.cancelledAt).toBeNull()
    expect(await loadNotificationJobs(testDb)).toHaveLength(0)
  })

  it('Idempotent: Uncancel auf nicht-gecanceltes Event → No-Op', async () => {
    const ownerId = await seedUser()
    const eventId = await seedEvent({ createdBy: ownerId, cancelledAt: null })

    const result = await uncancelEvent(eventId, selfActor(ownerId), { db })

    expect(result.uncancelled).toBe(false)
    expect((await loadEvent(eventId))?.cancelledAt).toBeNull()
    expect(await loadNotificationJobs(testDb)).toHaveLength(0)
  })

  it('Owner darf fremdes Event NICHT uncanceln → forbidden', async () => {
    const ownerId = await seedUser({ suffix: 'owner' })
    const strangerId = await seedUser({ suffix: 'stranger' })
    const eventId = await seedEvent({ createdBy: ownerId, cancelledAt: new Date() })

    await expect(
      uncancelEvent(eventId, selfActor(strangerId), { db }),
    ).rejects.toMatchObject({ code: 'forbidden' })

    expect((await loadEvent(eventId))?.cancelledAt).toBeTruthy()
  })

  it('Admin darf fremdes Event uncanceln', async () => {
    const ownerId = await seedUser({ suffix: 'owner' })
    const adminId = await seedUser({ role: 'admin', suffix: 'admin' })
    const eventId = await seedEvent({ createdBy: ownerId, cancelledAt: new Date() })

    const result = await uncancelEvent(eventId, adminActor(adminId), { db })

    expect(result.uncancelled).toBe(true)
    expect((await loadEvent(eventId))?.cancelledAt).toBeNull()
  })

  it('Unbekanntes Event → event_not_found', async () => {
    const adminId = await seedUser({ role: 'admin' })

    await expect(
      uncancelEvent(99999, adminActor(adminId), { db }),
    ).rejects.toMatchObject({ code: 'event_not_found' })
  })

  it('Uncancel löscht den Absage-Grund → cancelReason := null', async () => {
    const ownerId = await seedUser()
    const eventId = await seedEvent({
      createdBy: ownerId,
      cancelledAt: new Date(),
      cancelReason: 'Wegen Unwetter abgesagt',
    })

    await uncancelEvent(eventId, selfActor(ownerId), { db })

    expect((await loadEvent(eventId))?.cancelReason).toBeNull()
  })
})
