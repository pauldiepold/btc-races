import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { and, eq, isNotNull } from 'drizzle-orm'
import { ensureEventThread, type AppDb } from '~~/server/threads'
import { createTestDb, type TestDb } from '../../../helpers/test-db'

let testDb: TestDb
let db: AppDb

beforeEach(async () => {
  testDb = await createTestDb()
  db = testDb.db
})

afterEach(async () => {
  await testDb.cleanup()
})

async function seedUser(): Promise<number> {
  const [user] = await testDb.db.insert(testDb.schema.users).values({
    email: `user-${Math.random()}@example.com`,
    membershipStatus: 'active',
  }).returning()
  return user.id
}

async function seedEvent(opts: {
  type?: 'training' | 'competition' | 'ladv' | 'ladv_external' | 'social'
  createdBy?: number | null
  createdAt?: Date
} = {}): Promise<{ id: number, createdAt: Date }> {
  const [row] = await testDb.db.insert(testDb.schema.events).values({
    name: 'Test-Event',
    type: opts.type ?? 'training',
    date: '2026-06-01',
    createdBy: opts.createdBy ?? null,
    ...(opts.createdAt ? { createdAt: opts.createdAt, updatedAt: opts.createdAt } : {}),
  }).returning()
  return { id: row.id, createdAt: row.createdAt }
}

async function loadEventThread(eventId: number) {
  return testDb.db.query.threads.findFirst({
    where: eq(testDb.schema.threads.eventId, eventId),
  })
}

async function countEventThreads(eventId: number): Promise<number> {
  const rows = await testDb.db.query.threads.findMany({
    where: and(eq(testDb.schema.threads.eventId, eventId), isNotNull(testDb.schema.threads.eventId)),
  })
  return rows.length
}

describe('ensureEventThread', () => {
  it('creates an event thread with null title/body and event-derived room', async () => {
    const creator = await seedUser()
    const event = await seedEvent({ type: 'competition', createdBy: creator })

    const result = await ensureEventThread({ eventId: event.id }, { db })

    const thread = await loadEventThread(event.id)
    expect(thread).toBeDefined()
    expect(thread!.id).toBe(result.id)
    expect(thread!.eventId).toBe(event.id)
    expect(thread!.title).toBeNull()
    expect(thread!.body).toBeNull()
    expect(thread!.roomSlug).toBe('races')
    expect(thread!.createdBy).toBe(creator)
  })

  it('initialises lastActivityAt with the event creation timestamp', async () => {
    const createdAt = new Date('2026-02-15T10:00:00Z')
    const event = await seedEvent({ createdAt })

    await ensureEventThread({ eventId: event.id }, { db })

    const thread = await loadEventThread(event.id)
    expect(thread!.lastActivityAt.getTime()).toBe(event.createdAt.getTime())
  })

  it('is idempotent: a second call does not insert another thread', async () => {
    const event = await seedEvent()

    const first = await ensureEventThread({ eventId: event.id }, { db })
    const second = await ensureEventThread({ eventId: event.id }, { db })

    expect(second.id).toBe(first.id)
    expect(await countEventThreads(event.id)).toBe(1)
  })

  it('routes the event to the room derived from its type', async () => {
    const training = await seedEvent({ type: 'training' })
    const social = await seedEvent({ type: 'social' })
    const ladv = await seedEvent({ type: 'ladv' })

    await ensureEventThread({ eventId: training.id }, { db })
    await ensureEventThread({ eventId: social.id }, { db })
    await ensureEventThread({ eventId: ladv.id }, { db })

    expect((await loadEventThread(training.id))!.roomSlug).toBe('training')
    expect((await loadEventThread(social.id))!.roomSlug).toBe('social')
    expect((await loadEventThread(ladv.id))!.roomSlug).toBe('races')
  })

  it('throws event_not_found for an unknown event id', async () => {
    await expect(
      ensureEventThread({ eventId: 9999 }, { db }),
    ).rejects.toMatchObject({ code: 'event_not_found' })
  })
})
