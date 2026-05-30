import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { and, eq } from 'drizzle-orm'
import {
  createComment,
  setOverride,
  type AppDb,
  type ThreadActor,
} from '~~/server/threads'
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

async function seedThread(): Promise<number> {
  const [row] = await testDb.db.insert(testDb.schema.threads).values({
    roomSlug: 'training',
    title: 'Titel',
    body: 'Body',
    lastActivityAt: new Date('2026-01-01'),
  }).returning()
  return row.id
}

function selfActor(userId: number): ThreadActor {
  return { kind: 'self', userId }
}

async function loadOverride(userId: number, threadId: number) {
  return testDb.db.query.threadOverrides.findFirst({
    where: and(
      eq(testDb.schema.threadOverrides.userId, userId),
      eq(testDb.schema.threadOverrides.threadId, threadId),
    ),
  })
}

async function countOverrides(userId: number, threadId: number): Promise<number> {
  const rows = await testDb.db.select().from(testDb.schema.threadOverrides).where(
    and(
      eq(testDb.schema.threadOverrides.userId, userId),
      eq(testDb.schema.threadOverrides.threadId, threadId),
    ),
  )
  return rows.length
}

describe('setOverride', () => {
  it('mutes a thread for a user', async () => {
    const userId = await seedUser()
    const threadId = await seedThread()

    await setOverride({ threadId, state: 'muted' }, selfActor(userId), { db })

    const row = await loadOverride(userId, threadId)
    expect(row?.state).toBe('muted')
  })

  it('follows a thread for a user', async () => {
    const userId = await seedUser()
    const threadId = await seedThread()

    await setOverride({ threadId, state: 'following' }, selfActor(userId), { db })

    const row = await loadOverride(userId, threadId)
    expect(row?.state).toBe('following')
  })

  it('switches between muted and following without creating a second row', async () => {
    const userId = await seedUser()
    const threadId = await seedThread()

    await setOverride({ threadId, state: 'muted' }, selfActor(userId), { db })
    await setOverride({ threadId, state: 'following' }, selfActor(userId), { db })

    expect(await countOverrides(userId, threadId)).toBe(1)
    const row = await loadOverride(userId, threadId)
    expect(row?.state).toBe('following')
  })

  it('is idempotent when called twice with the same state', async () => {
    const userId = await seedUser()
    const threadId = await seedThread()

    await setOverride({ threadId, state: 'muted' }, selfActor(userId), { db })
    await setOverride({ threadId, state: 'muted' }, selfActor(userId), { db })

    expect(await countOverrides(userId, threadId)).toBe(1)
  })

  it('clears the override when state is null', async () => {
    const userId = await seedUser()
    const threadId = await seedThread()

    await setOverride({ threadId, state: 'muted' }, selfActor(userId), { db })
    await setOverride({ threadId, state: null }, selfActor(userId), { db })

    expect(await countOverrides(userId, threadId)).toBe(0)
  })

  it('clearing a non-existing override is a no-op', async () => {
    const userId = await seedUser()
    const threadId = await seedThread()

    await setOverride({ threadId, state: null }, selfActor(userId), { db })

    expect(await countOverrides(userId, threadId)).toBe(0)
  })

  it('throws thread_not_found for an unknown thread', async () => {
    const userId = await seedUser()

    await expect(
      setOverride({ threadId: 9999, state: 'muted' }, selfActor(userId), { db }),
    ).rejects.toMatchObject({ code: 'thread_not_found' })
  })

  it('does not lift a mute when the user later comments on the thread', async () => {
    const userId = await seedUser()
    const threadId = await seedThread()

    await setOverride({ threadId, state: 'muted' }, selfActor(userId), { db })
    await createComment({ threadId, body: 'Trotzdem ein Kommentar' }, selfActor(userId), { db })

    const row = await loadOverride(userId, threadId)
    expect(row?.state).toBe('muted')
  })
})
