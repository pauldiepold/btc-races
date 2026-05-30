import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { eq } from 'drizzle-orm'
import { createComment, type AppDb, type ThreadActor } from '~~/server/threads'
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

async function seedThread(lastActivityAt = new Date('2026-01-01')): Promise<number> {
  const [row] = await testDb.db.insert(testDb.schema.threads).values({
    roomSlug: 'training',
    title: 'Titel',
    body: 'Body',
    lastActivityAt,
  }).returning()
  return row.id
}

function selfActor(userId: number): ThreadActor {
  return { kind: 'self', userId }
}

async function loadComment(id: number) {
  return testDb.db.query.comments.findFirst({
    where: eq(testDb.schema.comments.id, id),
  })
}

async function loadThread(id: number) {
  return testDb.db.query.threads.findFirst({
    where: eq(testDb.schema.threads.id, id),
  })
}

describe('createComment', () => {
  it('appends a comment to a thread', async () => {
    const userId = await seedUser()
    const threadId = await seedThread()

    const { id } = await createComment(
      { threadId, body: 'Klasse Beitrag!' },
      selfActor(userId),
      { db },
    )

    const comment = await loadComment(id)
    expect(comment).toMatchObject({
      threadId,
      userId,
      body: 'Klasse Beitrag!',
      deletedAt: null,
    })
  })

  it('lifts the thread lastActivityAt to the new comment time', async () => {
    const userId = await seedUser()
    const threadId = await seedThread(new Date('2026-01-01'))
    const before = Date.now()

    const { id } = await createComment(
      { threadId, body: 'Antwort' },
      selfActor(userId),
      { db },
    )

    const comment = await loadComment(id)
    const thread = await loadThread(threadId)
    expect(thread!.lastActivityAt.getTime()).toBe(comment!.createdAt.getTime())
    expect(thread!.lastActivityAt.getTime()).toBeGreaterThanOrEqual(before - 1000)
  })

  it('rejects a comment body over 5000 characters', async () => {
    const userId = await seedUser()
    const threadId = await seedThread()

    await expect(
      createComment(
        { threadId, body: 'x'.repeat(5001) },
        selfActor(userId),
        { db },
      ),
    ).rejects.toMatchObject({ code: 'comment_too_long' })
  })

  it('throws thread_not_found for an unknown thread', async () => {
    const userId = await seedUser()

    await expect(
      createComment(
        { threadId: 9999, body: 'Antwort' },
        selfActor(userId),
        { db },
      ),
    ).rejects.toMatchObject({ code: 'thread_not_found' })
  })

  it('throws thread_deleted for a soft-deleted thread', async () => {
    const userId = await seedUser()
    const [row] = await testDb.db.insert(testDb.schema.threads).values({
      roomSlug: 'training',
      title: 'Titel',
      body: 'Body',
      lastActivityAt: new Date('2026-01-01'),
      deletedAt: new Date('2026-01-02'),
    }).returning()

    await expect(
      createComment(
        { threadId: row.id, body: 'Antwort' },
        selfActor(userId),
        { db },
      ),
    ).rejects.toMatchObject({ code: 'thread_deleted' })
  })
})
