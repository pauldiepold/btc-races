import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { eq } from 'drizzle-orm'
import { createThread, type AppDb, type ThreadActor } from '~~/server/threads'
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

function selfActor(userId: number): ThreadActor {
  return { kind: 'self', userId }
}

function adminActor(userId: number): ThreadActor {
  return { kind: 'admin', userId }
}

async function loadThread(id: number) {
  return testDb.db.query.threads.findFirst({
    where: eq(testDb.schema.threads.id, id),
  })
}

describe('createThread', () => {
  it('lets a member create a Beitrag in an open room', async () => {
    const userId = await seedUser()

    const { id } = await createThread(
      { roomSlug: 'training', title: 'Schuhempfehlung?', body: 'Welche **Spikes**?' },
      selfActor(userId),
      { db },
    )

    const thread = await loadThread(id)
    expect(thread).toMatchObject({
      roomSlug: 'training',
      title: 'Schuhempfehlung?',
      body: 'Welche **Spikes**?',
      eventId: null,
      deletedAt: null,
      createdBy: userId,
    })
  })

  it('initialises lastActivityAt at creation time', async () => {
    const userId = await seedUser()
    const before = Date.now()

    const { id } = await createThread(
      { roomSlug: 'team', title: 'Titel', body: 'Body' },
      selfActor(userId),
      { db },
    )

    const thread = await loadThread(id)
    expect(thread!.lastActivityAt.getTime()).toBeGreaterThanOrEqual(before - 1000)
    expect(thread!.lastActivityAt.getTime()).toBeLessThanOrEqual(Date.now() + 1000)
  })

  it('forbids a member from posting in the Ankündigungen room', async () => {
    const userId = await seedUser()

    await expect(
      createThread(
        { roomSlug: 'announcements', title: 'Titel', body: 'Body' },
        selfActor(userId),
        { db },
      ),
    ).rejects.toMatchObject({ code: 'forbidden' })
  })

  it('lets an admin post in the Ankündigungen room', async () => {
    const adminId = await seedUser('admin')

    const { id } = await createThread(
      { roomSlug: 'announcements', title: 'Wichtige Info', body: 'Body' },
      adminActor(adminId),
      { db },
    )

    expect((await loadThread(id))?.roomSlug).toBe('announcements')
  })

  it('rejects a title over 200 characters', async () => {
    const userId = await seedUser()

    await expect(
      createThread(
        { roomSlug: 'training', title: 'x'.repeat(201), body: 'Body' },
        selfActor(userId),
        { db },
      ),
    ).rejects.toMatchObject({ code: 'thread_too_long' })
  })

  it('rejects a body over 5000 characters', async () => {
    const userId = await seedUser()

    await expect(
      createThread(
        { roomSlug: 'training', title: 'Titel', body: 'x'.repeat(5001) },
        selfActor(userId),
        { db },
      ),
    ).rejects.toMatchObject({ code: 'thread_too_long' })
  })

  it('rejects an unknown room slug', async () => {
    const userId = await seedUser()

    await expect(
      createThread(
        { roomSlug: 'lounge', title: 'Titel', body: 'Body' },
        selfActor(userId),
        { db },
      ),
    ).rejects.toMatchObject({ code: 'room_not_found' })
  })
})
