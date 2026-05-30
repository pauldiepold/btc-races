import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { eq } from 'drizzle-orm'
import { pinComment, unpinComment, type AppDb, type ThreadActor } from '~~/server/threads'
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

async function seedThread(createdBy: number | null = null): Promise<number> {
  const [row] = await testDb.db.insert(testDb.schema.threads).values({
    roomSlug: 'training',
    title: 'Titel',
    body: 'Body',
    lastActivityAt: PAST_ACTIVITY,
    createdBy,
  }).returning()
  return row.id
}

async function seedComment(opts: {
  threadId: number
  userId: number | null
  body?: string
  pinnedAt?: Date | null
  pinnedBy?: number | null
  deletedAt?: Date | null
}): Promise<number> {
  const [row] = await testDb.db.insert(testDb.schema.comments).values({
    threadId: opts.threadId,
    userId: opts.userId,
    body: opts.body ?? 'Inhalt',
    pinnedAt: opts.pinnedAt ?? null,
    pinnedBy: opts.pinnedBy ?? null,
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

describe('pinComment', () => {
  it('pins a comment — sets pinnedAt to now and pinnedBy to the actor', async () => {
    const admin = await seedUser('admin')
    const author = await seedUser()
    const threadId = await seedThread()
    const commentId = await seedComment({ threadId, userId: author })
    const before = Date.now()

    await pinComment({ commentId }, adminActor(admin), { db })

    const comment = await loadComment(commentId)
    expect(comment!.pinnedAt).toBeInstanceOf(Date)
    expect(comment!.pinnedAt!.getTime()).toBeGreaterThanOrEqual(before - 1000)
    expect(comment!.pinnedBy).toBe(admin)
  })

  it('does not bump updatedAt when pinning — pinning is not an edit', async () => {
    const admin = await seedUser('admin')
    const author = await seedUser()
    const threadId = await seedThread()
    const commentId = await seedComment({ threadId, userId: author })

    // Kommentar in die Vergangenheit setzen, damit ein versehentlicher
    // updatedAt-Bump (Drizzle $onUpdateFn) zuverlässig sichtbar wäre.
    const past = new Date('2026-01-01T00:00:00Z')
    await testDb.db
      .update(testDb.schema.comments)
      .set({ createdAt: past, updatedAt: past })
      .where(eq(testDb.schema.comments.id, commentId))

    await pinComment({ commentId }, adminActor(admin), { db })

    const comment = await loadComment(commentId)
    expect(comment!.updatedAt.getTime()).toBe(past.getTime())
  })

  it('does not bump updatedAt when unpinning', async () => {
    const admin = await seedUser('admin')
    const author = await seedUser()
    const threadId = await seedThread()
    const commentId = await seedComment({ threadId, userId: author, pinnedAt: new Date() })

    const past = new Date('2026-01-01T00:00:00Z')
    await testDb.db
      .update(testDb.schema.comments)
      .set({ createdAt: past, updatedAt: past })
      .where(eq(testDb.schema.comments.id, commentId))

    await unpinComment({ commentId }, adminActor(admin), { db })

    const comment = await loadComment(commentId)
    expect(comment!.updatedAt.getTime()).toBe(past.getTime())
  })

  it('lets the thread author pin a foreign comment in their own thread', async () => {
    const author = await seedUser()
    const stranger = await seedUser()
    const threadId = await seedThread(author)
    const commentId = await seedComment({ threadId, userId: stranger })

    await pinComment({ commentId }, selfActor(author), { db })

    expect((await loadComment(commentId))!.pinnedAt).toBeInstanceOf(Date)
  })

  it('forbids a non-author non-admin from pinning', async () => {
    const author = await seedUser()
    const stranger = await seedUser()
    const threadId = await seedThread(author)
    const commentId = await seedComment({ threadId, userId: author })

    await expect(
      pinComment({ commentId }, selfActor(stranger), { db }),
    ).rejects.toMatchObject({ code: 'forbidden' })
  })

  it('refuses to pin a soft-deleted comment', async () => {
    const admin = await seedUser('admin')
    const author = await seedUser()
    const threadId = await seedThread()
    const commentId = await seedComment({
      threadId,
      userId: author,
      deletedAt: new Date(),
    })

    await expect(
      pinComment({ commentId }, adminActor(admin), { db }),
    ).rejects.toMatchObject({ code: 'forbidden' })
  })

  it('throws pin_limit_reached when 3 comments in the thread are already pinned', async () => {
    const admin = await seedUser('admin')
    const author = await seedUser()
    const threadId = await seedThread()
    // 3 angeheftete Kommentare seeden
    for (let i = 0; i < 3; i++) {
      await seedComment({
        threadId,
        userId: author,
        pinnedAt: new Date(),
        pinnedBy: admin,
      })
    }
    const candidate = await seedComment({ threadId, userId: author })

    await expect(
      pinComment({ commentId: candidate }, adminActor(admin), { db }),
    ).rejects.toMatchObject({ code: 'pin_limit_reached' })
  })

  it('counts only this threads pinned comments toward the limit (other threads do not contribute)', async () => {
    const admin = await seedUser('admin')
    const author = await seedUser()
    const otherThread = await seedThread()
    // 3 angeheftete in einem anderen Thread
    for (let i = 0; i < 3; i++) {
      await seedComment({
        threadId: otherThread,
        userId: author,
        pinnedAt: new Date(),
        pinnedBy: admin,
      })
    }
    const ourThread = await seedThread()
    const candidate = await seedComment({ threadId: ourThread, userId: author })

    await pinComment({ commentId: candidate }, adminActor(admin), { db })

    expect((await loadComment(candidate))!.pinnedAt).toBeInstanceOf(Date)
  })

  it('does not count soft-deleted pinned comments toward the limit', async () => {
    const admin = await seedUser('admin')
    const author = await seedUser()
    const threadId = await seedThread()
    // 3 angeheftete, alle soft-gelöscht
    for (let i = 0; i < 3; i++) {
      await seedComment({
        threadId,
        userId: author,
        pinnedAt: new Date(),
        pinnedBy: admin,
        deletedAt: new Date(),
      })
    }
    const candidate = await seedComment({ threadId, userId: author })

    await pinComment({ commentId: candidate }, adminActor(admin), { db })

    expect((await loadComment(candidate))!.pinnedAt).toBeInstanceOf(Date)
  })

  it('is a no-op when the comment is already pinned (does not overwrite pinnedAt/pinnedBy)', async () => {
    const admin = await seedUser('admin')
    const otherAdmin = await seedUser('admin')
    const author = await seedUser()
    const threadId = await seedThread()
    const originalAt = new Date('2026-02-01T12:00:00Z')
    const commentId = await seedComment({
      threadId,
      userId: author,
      pinnedAt: originalAt,
      pinnedBy: admin,
    })

    await pinComment({ commentId }, adminActor(otherAdmin), { db })

    const comment = await loadComment(commentId)
    expect(comment!.pinnedAt!.getTime()).toBe(originalAt.getTime())
    expect(comment!.pinnedBy).toBe(admin)
  })

  it('does not touch the threads lastActivityAt', async () => {
    const admin = await seedUser('admin')
    const author = await seedUser()
    const threadId = await seedThread()
    const commentId = await seedComment({ threadId, userId: author })

    await pinComment({ commentId }, adminActor(admin), { db })

    expect((await loadThread(threadId))!.lastActivityAt.getTime()).toBe(PAST_ACTIVITY.getTime())
  })

  it('throws comment_not_found for an unknown id', async () => {
    const admin = await seedUser('admin')

    await expect(
      pinComment({ commentId: 9999 }, adminActor(admin), { db }),
    ).rejects.toMatchObject({ code: 'comment_not_found' })
  })
})

describe('unpinComment', () => {
  it('clears pinnedAt and pinnedBy', async () => {
    const admin = await seedUser('admin')
    const author = await seedUser()
    const threadId = await seedThread()
    const commentId = await seedComment({
      threadId,
      userId: author,
      pinnedAt: new Date('2026-02-01'),
      pinnedBy: admin,
    })

    await unpinComment({ commentId }, adminActor(admin), { db })

    const comment = await loadComment(commentId)
    expect(comment!.pinnedAt).toBeNull()
    expect(comment!.pinnedBy).toBeNull()
  })

  it('lets the thread author unpin', async () => {
    const author = await seedUser()
    const otherAdmin = await seedUser('admin')
    const threadId = await seedThread(author)
    const commentId = await seedComment({
      threadId,
      userId: author,
      pinnedAt: new Date(),
      pinnedBy: otherAdmin,
    })

    await unpinComment({ commentId }, selfActor(author), { db })

    expect((await loadComment(commentId))!.pinnedAt).toBeNull()
  })

  it('forbids a non-author non-admin from unpinning', async () => {
    const author = await seedUser()
    const stranger = await seedUser()
    const admin = await seedUser('admin')
    const threadId = await seedThread(author)
    const commentId = await seedComment({
      threadId,
      userId: author,
      pinnedAt: new Date(),
      pinnedBy: admin,
    })

    await expect(
      unpinComment({ commentId }, selfActor(stranger), { db }),
    ).rejects.toMatchObject({ code: 'forbidden' })
  })

  it('is a no-op when the comment is not pinned', async () => {
    const admin = await seedUser('admin')
    const author = await seedUser()
    const threadId = await seedThread()
    const commentId = await seedComment({ threadId, userId: author })

    await unpinComment({ commentId }, adminActor(admin), { db })

    const comment = await loadComment(commentId)
    expect(comment!.pinnedAt).toBeNull()
  })

  it('throws comment_not_found for an unknown id', async () => {
    const admin = await seedUser('admin')

    await expect(
      unpinComment({ commentId: 9999 }, adminActor(admin), { db }),
    ).rejects.toMatchObject({ code: 'comment_not_found' })
  })
})
