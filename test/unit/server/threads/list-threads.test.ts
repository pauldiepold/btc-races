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
}): Promise<void> {
  await testDb.db.insert(testDb.schema.threads).values({
    roomSlug: opts.roomSlug ?? 'training',
    title: opts.title ?? 'Titel',
    body: 'Body',
    lastActivityAt: opts.lastActivityAt,
    deletedAt: opts.deletedAt ?? null,
  })
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

  it('excludes soft-deleted threads', async () => {
    await seedThread({ title: 'sichtbar', lastActivityAt: new Date('2026-01-01') })
    await seedThread({ title: 'gelöscht', lastActivityAt: new Date('2026-02-01'), deletedAt: new Date() })

    const threads = await listThreads({}, { db })

    expect(threads.map(t => t.title)).toEqual(['sichtbar'])
  })
})
