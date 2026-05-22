import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { listComments, type AppDb } from '~~/server/threads'
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
    title: 'Titel',
    body: 'Body',
    lastActivityAt: new Date('2026-01-01'),
  }).returning()
  return row.id
}

async function seedComment(opts: {
  threadId: number
  body: string
  createdAt: Date
}): Promise<void> {
  await testDb.db.insert(testDb.schema.comments).values({
    threadId: opts.threadId,
    body: opts.body,
    createdAt: opts.createdAt,
  })
}

describe('listComments', () => {
  it('returns comments ordered by createdAt ascending', async () => {
    const threadId = await seedThread()
    await seedComment({ threadId, body: 'zweiter', createdAt: new Date('2026-02-01') })
    await seedComment({ threadId, body: 'erster', createdAt: new Date('2026-01-01') })
    await seedComment({ threadId, body: 'dritter', createdAt: new Date('2026-03-01') })

    const comments = await listComments({ threadId }, { db })

    expect(comments.map(c => c.body)).toEqual(['erster', 'zweiter', 'dritter'])
  })

  it('with since returns only comments created after the cutoff', async () => {
    const threadId = await seedThread()
    await seedComment({ threadId, body: 'alt', createdAt: new Date('2026-01-01') })
    await seedComment({ threadId, body: 'neu', createdAt: new Date('2026-03-01') })

    const comments = await listComments(
      { threadId, since: new Date('2026-02-01') },
      { db },
    )

    expect(comments.map(c => c.body)).toEqual(['neu'])
  })
})
