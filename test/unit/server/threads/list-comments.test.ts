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
  deletedAt?: Date | null
}): Promise<void> {
  await testDb.db.insert(testDb.schema.comments).values({
    threadId: opts.threadId,
    body: opts.body,
    createdAt: opts.createdAt,
    deletedAt: opts.deletedAt ?? null,
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

  it('includes a comment created exactly at the since cutoff (gte boundary)', async () => {
    const threadId = await seedThread()
    const boundary = new Date('2026-02-01T10:00:00Z')
    await seedComment({ threadId, body: 'früher', createdAt: new Date('2026-01-01') })
    await seedComment({ threadId, body: 'grenze', createdAt: boundary })

    const comments = await listComments({ threadId, since: boundary }, { db })

    expect(comments.map(c => c.body)).toEqual(['grenze'])
  })

  it('redacts the body of soft-deleted comments to an empty string', async () => {
    const threadId = await seedThread()
    await seedComment({
      threadId,
      body: 'Geheimer Originaltext',
      createdAt: new Date('2026-01-01'),
      deletedAt: new Date('2026-01-02'),
    })

    const [comment] = await listComments({ threadId }, { db })

    expect(comment.body).toBe('')
    expect(comment.deletedAt).not.toBeNull()
  })
})
