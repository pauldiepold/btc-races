import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { eq } from 'drizzle-orm'
import { backfillEventThreads, type AppDb } from '~~/server/threads'
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

async function seedEvent(type: 'training' | 'competition' | 'social' = 'training'): Promise<number> {
  const [row] = await testDb.db.insert(testDb.schema.events).values({
    name: 'Event',
    type,
    date: '2026-06-01',
  }).returning()
  return row.id
}

async function countThreadsForEvent(eventId: number): Promise<number> {
  const rows = await testDb.db.query.threads.findMany({
    where: eq(testDb.schema.threads.eventId, eventId),
  })
  return rows.length
}

describe('backfillEventThreads', () => {
  it('creates an event thread for every event that does not have one', async () => {
    const a = await seedEvent('training')
    const b = await seedEvent('competition')
    const c = await seedEvent('social')

    const result = await backfillEventThreads({ db })

    expect(result.created).toBe(3)
    expect(await countThreadsForEvent(a)).toBe(1)
    expect(await countThreadsForEvent(b)).toBe(1)
    expect(await countThreadsForEvent(c)).toBe(1)
  })

  it('skips events that already have a thread (idempotent)', async () => {
    const a = await seedEvent('training')
    const b = await seedEvent('competition')

    await backfillEventThreads({ db })
    const second = await backfillEventThreads({ db })

    expect(second.created).toBe(0)
    expect(await countThreadsForEvent(a)).toBe(1)
    expect(await countThreadsForEvent(b)).toBe(1)
  })

  it('returns zero created when no events exist', async () => {
    const result = await backfillEventThreads({ db })
    expect(result.created).toBe(0)
  })
})
