import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { eq } from 'drizzle-orm'
import { deleteComment, type AppDb, type ThreadActor } from '~~/server/threads'
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
}): Promise<number> {
  const [row] = await testDb.db.insert(testDb.schema.comments).values({
    threadId: opts.threadId,
    userId: opts.userId,
    body: opts.body ?? 'Inhalt',
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

describe('deleteComment', () => {
  it('soft-deletes the authors own comment — body stays for forensics', async () => {
    const userId = await seedUser()
    const threadId = await seedThread()
    const commentId = await seedComment({ threadId, userId, body: 'Geheim' })
    const before = Date.now()

    await deleteComment({ commentId }, selfActor(userId), { db })

    const comment = await loadComment(commentId)
    expect(comment!.deletedAt).toBeInstanceOf(Date)
    expect(comment!.deletedAt!.getTime()).toBeGreaterThanOrEqual(before - 1000)
    // Body bleibt in der DB — der Tombstone „Kommentar gelöscht" ist UI-Concern
    expect(comment!.body).toBe('Geheim')
  })

  it('does not touch the threads lastActivityAt', async () => {
    const userId = await seedUser()
    const threadId = await seedThread()
    const commentId = await seedComment({ threadId, userId })

    await deleteComment({ commentId }, selfActor(userId), { db })

    expect((await loadThread(threadId))!.lastActivityAt.getTime()).toBe(PAST_ACTIVITY.getTime())
  })

  it('lets an admin delete a foreign comment', async () => {
    const author = await seedUser()
    const admin = await seedUser('admin')
    const threadId = await seedThread()
    const commentId = await seedComment({ threadId, userId: author })

    await deleteComment({ commentId }, adminActor(admin), { db })

    expect((await loadComment(commentId))!.deletedAt).toBeInstanceOf(Date)
  })

  it('forbids a different member from deleting the comment', async () => {
    const author = await seedUser()
    const stranger = await seedUser()
    const threadId = await seedThread()
    const commentId = await seedComment({ threadId, userId: author })

    await expect(
      deleteComment({ commentId }, selfActor(stranger), { db }),
    ).rejects.toMatchObject({ code: 'forbidden' })
  })

  it('forbids deleting an already-deleted comment', async () => {
    const userId = await seedUser()
    const threadId = await seedThread()
    const commentId = await seedComment({ threadId, userId })
    await deleteComment({ commentId }, selfActor(userId), { db })

    await expect(
      deleteComment({ commentId }, selfActor(userId), { db }),
    ).rejects.toMatchObject({ code: 'forbidden' })
  })

  it('throws comment_not_found for an unknown id', async () => {
    const userId = await seedUser()

    await expect(
      deleteComment({ commentId: 9999 }, selfActor(userId), { db }),
    ).rejects.toMatchObject({ code: 'comment_not_found' })
  })
})
