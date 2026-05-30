import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { listThreads, type AppDb } from '~~/server/threads'
import type { RoomSlug } from '~~/shared/types/threads'
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

async function seedThread(opts: {
  roomSlug?: RoomSlug
  title?: string
  lastActivityAt: Date
  deletedAt?: Date | null
}): Promise<number> {
  const [row] = await testDb.db.insert(testDb.schema.threads).values({
    roomSlug: opts.roomSlug ?? 'training',
    title: opts.title ?? 'Titel',
    body: 'Body',
    lastActivityAt: opts.lastActivityAt,
    deletedAt: opts.deletedAt ?? null,
  }).returning()
  return row.id
}

async function seedEvent(opts: {
  name?: string
  type?: 'training' | 'competition' | 'ladv' | 'ladv_external' | 'social'
  date?: string | null
  location?: string | null
} = {}): Promise<number> {
  const [row] = await testDb.db.insert(testDb.schema.events).values({
    name: opts.name ?? 'Test-Event',
    type: opts.type ?? 'training',
    date: opts.date ?? '2026-06-01',
    location: opts.location ?? null,
  }).returning()
  return row.id
}

async function seedEventThread(opts: {
  eventId: number
  roomSlug?: RoomSlug
  lastActivityAt: Date
}): Promise<number> {
  const [row] = await testDb.db.insert(testDb.schema.threads).values({
    roomSlug: opts.roomSlug ?? 'training',
    title: null,
    body: null,
    eventId: opts.eventId,
    lastActivityAt: opts.lastActivityAt,
  }).returning()
  return row.id
}

async function seedComment(threadId: number): Promise<void> {
  await testDb.db.insert(testDb.schema.comments).values({ threadId, body: 'Kommentar' })
}

describe('listThreads', () => {
  it('returns threads ordered by last activity, newest first', async () => {
    await seedThread({ title: 'älter', lastActivityAt: new Date('2026-01-01') })
    await seedThread({ title: 'neuer', lastActivityAt: new Date('2026-05-01') })
    await seedThread({ title: 'mittel', lastActivityAt: new Date('2026-03-01') })

    const threads = await listThreads({}, { db })

    expect(threads.map(t => t.title)).toEqual(['neuer', 'mittel', 'älter'])
  })

  it('filters to a single room when a room slug is given', async () => {
    await seedThread({ roomSlug: 'training', title: 'Training-Thread', lastActivityAt: new Date('2026-01-01') })
    await seedThread({ roomSlug: 'social', title: 'Social-Thread', lastActivityAt: new Date('2026-01-02') })

    const threads = await listThreads({ roomSlug: 'social' }, { db })

    expect(threads.map(t => t.title)).toEqual(['Social-Thread'])
  })

  it('returns threads from every room when no filter is given', async () => {
    await seedThread({ roomSlug: 'training', lastActivityAt: new Date('2026-01-01') })
    await seedThread({ roomSlug: 'races', lastActivityAt: new Date('2026-01-02') })

    const threads = await listThreads({}, { db })

    expect(threads).toHaveLength(2)
  })

  it('includes the comment count per thread', async () => {
    const rege = await seedThread({ title: 'rege', lastActivityAt: new Date('2026-02-01') })
    await seedThread({ title: 'still', lastActivityAt: new Date('2026-01-01') })
    await seedComment(rege)
    await seedComment(rege)

    const threads = await listThreads({}, { db })

    const counts = Object.fromEntries(threads.map(t => [t.title, t.commentCount]))
    expect(counts).toEqual({ rege: 2, still: 0 })
  })

  it('includes event threads with their event data joined', async () => {
    const eventId = await seedEvent({
      name: 'BBM 5000m',
      type: 'competition',
      date: '2026-06-15',
      location: 'Mommsenstadion',
    })
    await seedEventThread({ eventId, roomSlug: 'races', lastActivityAt: new Date('2026-03-01') })

    const threads = await listThreads({}, { db })

    expect(threads).toHaveLength(1)
    expect(threads[0]!.event).toEqual({
      id: eventId,
      name: 'BBM 5000m',
      date: '2026-06-15',
      location: 'Mommsenstadion',
    })
  })

  it('sets event to null on regular post threads', async () => {
    await seedThread({ title: 'Beitrag', lastActivityAt: new Date('2026-01-01') })

    const threads = await listThreads({}, { db })

    expect(threads[0]!.event).toBeNull()
  })

  it('orders event threads and posts together by last activity', async () => {
    const eventId = await seedEvent({ name: 'Event A' })
    await seedThread({ title: 'älter', lastActivityAt: new Date('2026-01-01') })
    await seedEventThread({ eventId, lastActivityAt: new Date('2026-04-01') })
    await seedThread({ title: 'neuer', lastActivityAt: new Date('2026-02-01') })

    const threads = await listThreads({}, { db })

    expect(threads.map(t => t.event?.name ?? t.title)).toEqual(['Event A', 'neuer', 'älter'])
  })

  it('filters event threads by room slug', async () => {
    const trainingEvent = await seedEvent({ type: 'training', name: 'Bahntraining' })
    const racesEvent = await seedEvent({ type: 'competition', name: 'BBM' })
    await seedEventThread({ eventId: trainingEvent, roomSlug: 'training', lastActivityAt: new Date('2026-01-01') })
    await seedEventThread({ eventId: racesEvent, roomSlug: 'races', lastActivityAt: new Date('2026-01-02') })

    const threads = await listThreads({ roomSlug: 'races' }, { db })

    expect(threads.map(t => t.event?.name)).toEqual(['BBM'])
  })

  it('excludes soft-deleted threads', async () => {
    await seedThread({ title: 'sichtbar', lastActivityAt: new Date('2026-01-01') })
    await seedThread({ title: 'gelöscht', lastActivityAt: new Date('2026-02-01'), deletedAt: new Date() })

    const threads = await listThreads({}, { db })

    expect(threads.map(t => t.title)).toEqual(['sichtbar'])
  })
})
