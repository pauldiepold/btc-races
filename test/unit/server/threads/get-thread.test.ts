import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getThread, type AppDb } from '~~/server/threads'
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

async function seedThread(): Promise<number> {
  const [row] = await testDb.db.insert(testDb.schema.threads).values({
    roomSlug: 'training',
    title: 'Schuhempfehlung?',
    body: 'Welche **Spikes**?',
    lastActivityAt: new Date('2026-05-01'),
  }).returning()
  return row.id
}

describe('getThread', () => {
  it('loads a thread by id', async () => {
    const id = await seedThread()

    const thread = await getThread({ threadId: id }, { db })

    expect(thread).toMatchObject({
      id,
      roomSlug: 'training',
      title: 'Schuhempfehlung?',
      body: 'Welche **Spikes**?',
    })
  })

  it('throws thread_not_found for an unknown id', async () => {
    await expect(
      getThread({ threadId: 9999 }, { db }),
    ).rejects.toMatchObject({ code: 'thread_not_found' })
  })
})
