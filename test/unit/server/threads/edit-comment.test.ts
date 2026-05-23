import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { eq } from 'drizzle-orm'
import { editComment, type AppDb, type ThreadActor } from '~~/server/threads'
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

async function seedUser(role: 'member' | 'admin' = 'member'): Promise<number> {
  const [user] = await testDb.db.insert(testDb.schema.users).values({
    email: `user-${Math.random()}@example.com`,
    membershipStatus: 'active',
    role,
  }).returning()
  return user.id
}

const PAST_ACTIVITY = new Date('2026-01-01')

async function seedThread(): Promise<number> {
  const [row] = await testDb.db.insert(testDb.schema.threads).values({
    roomSlug: 'training',
    title: 'Titel',
    body: 'Body',
    lastActivityAt: PAST_ACTIVITY,
  }).returning()
  return row.id
}

async function seedComment(opts: {
  threadId: number
  userId: number | null
  body?: string
  deletedAt?: Date | null
}): Promise<number> {
  const [row] = await testDb.db.insert(testDb.schema.comments).values({
    threadId: opts.threadId,
    userId: opts.userId,
    body: opts.body ?? 'Original',
    deletedAt: opts.deletedAt ?? null,
  }).returning()
  return row.id
}

function selfActor(userId: number): ThreadActor {
  return { kind: 'self', userId }
}

function adminActor(userId: number): ThreadActor {
  return { kind: 'admin', userId }
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

describe('editComment', () => {
  it('updates the body of the authors own comment', async () => {
    const userId = await seedUser()
    const threadId = await seedThread()
    const commentId = await seedComment({ threadId, userId })

    await editComment(
      { commentId, body: 'Geändert' },
      selfActor(userId),
      { db },
    )

    expect((await loadComment(commentId))!.body).toBe('Geändert')
  })

  it('does not touch the threads lastActivityAt', async () => {
    const userId = await seedUser()
    const threadId = await seedThread()
    const commentId = await seedComment({ threadId, userId })

    await editComment({ commentId, body: 'X' }, selfActor(userId), { db })

    expect((await loadThread(threadId))!.lastActivityAt.getTime()).toBe(PAST_ACTIVITY.getTime())
  })

  it('forbids an admin from editing a foreign comment (delete yes, rewrite no)', async () => {
    const author = await seedUser()
    const admin = await seedUser('admin')
    const threadId = await seedThread()
    const commentId = await seedComment({ threadId, userId: author })

    await expect(
      editComment(
        { commentId, body: 'Hack' },
        adminActor(admin),
        { db },
      ),
    ).rejects.toMatchObject({ code: 'forbidden' })
  })

  it('forbids a different member from editing the comment', async () => {
    const author = await seedUser()
    const stranger = await seedUser()
    const threadId = await seedThread()
    const commentId = await seedComment({ threadId, userId: author })

    await expect(
      editComment(
        { commentId, body: 'Hack' },
        selfActor(stranger),
        { db },
      ),
    ).rejects.toMatchObject({ code: 'forbidden' })
  })

  it('forbids editing a soft-deleted comment', async () => {
    const userId = await seedUser()
    const threadId = await seedThread()
    const commentId = await seedComment({ threadId, userId, deletedAt: new Date() })

    await expect(
      editComment({ commentId, body: 'X' }, selfActor(userId), { db }),
    ).rejects.toMatchObject({ code: 'forbidden' })
  })

  it('throws comment_not_found for an unknown id', async () => {
    const userId = await seedUser()

    await expect(
      editComment({ commentId: 9999, body: 'X' }, selfActor(userId), { db }),
    ).rejects.toMatchObject({ code: 'comment_not_found' })
  })

  it('rejects a body over 5000 characters', async () => {
    const userId = await seedUser()
    const threadId = await seedThread()
    const commentId = await seedComment({ threadId, userId })

    await expect(
      editComment(
        { commentId, body: 'x'.repeat(5001) },
        selfActor(userId),
        { db },
      ),
    ).rejects.toMatchObject({ code: 'comment_too_long' })
  })
})
