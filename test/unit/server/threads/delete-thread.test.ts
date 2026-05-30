import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { eq } from 'drizzle-orm'
import { deleteThread, listThreads, type AppDb, type ThreadActor } from '~~/server/threads'
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

async function seedThread(opts: {
  createdBy?: number
  eventId?: number | null
  title?: string
} = {}): Promise<number> {
  const [row] = await testDb.db.insert(testDb.schema.threads).values({
    roomSlug: 'training',
    title: opts.title ?? 'Titel',
    body: 'Body',
    eventId: opts.eventId ?? null,
    lastActivityAt: PAST_ACTIVITY,
    createdBy: opts.createdBy ?? null,
  }).returning()
  return row.id
}

async function seedEvent(): Promise<number> {
  const [row] = await testDb.db.insert(testDb.schema.events).values({
    name: 'Event',
    type: 'training',
    date: '2026-06-01',
  }).returning()
  return row.id
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

describe('deleteThread', () => {
  it('soft-deletes the authors own Beitrag (deletedAt set, body remains)', async () => {
    const userId = await seedUser()
    const threadId = await seedThread({ createdBy: userId })
    const before = Date.now()

    await deleteThread({ threadId }, selfActor(userId), { db })

    const thread = await loadThread(threadId)
    expect(thread!.deletedAt).toBeInstanceOf(Date)
    expect(thread!.deletedAt!.getTime()).toBeGreaterThanOrEqual(before - 1000)
    expect(thread!.body).toBe('Body')
    expect(thread!.title).toBe('Titel')
  })

  it('does not touch lastActivityAt', async () => {
    const userId = await seedUser()
    const threadId = await seedThread({ createdBy: userId })

    await deleteThread({ threadId }, selfActor(userId), { db })

    expect((await loadThread(threadId))!.lastActivityAt.getTime()).toBe(PAST_ACTIVITY.getTime())
  })

  it('removes the Beitrag from listThreads after deletion', async () => {
    const userId = await seedUser()
    const visibleId = await seedThread({ createdBy: userId, title: 'sichtbar' })
    const doomedId = await seedThread({ createdBy: userId, title: 'gelöscht' })

    await deleteThread({ threadId: doomedId }, selfActor(userId), { db })

    const titles = (await listThreads({}, { db })).map(t => t.title)
    expect(titles).toEqual(['sichtbar'])
    expect(titles).not.toContain('gelöscht')
    // Doomed thread row is still in the DB
    expect(await loadThread(doomedId)).toBeDefined()
    // Keep the visible one referenced for readability
    expect(visibleId).toBeTypeOf('number')
  })

  it('lets an admin delete a foreign Beitrag', async () => {
    const author = await seedUser()
    const admin = await seedUser('admin')
    const threadId = await seedThread({ createdBy: author })

    await deleteThread({ threadId }, adminActor(admin), { db })

    expect((await loadThread(threadId))!.deletedAt).toBeInstanceOf(Date)
  })

  it('forbids a non-author non-admin from deleting', async () => {
    const author = await seedUser()
    const stranger = await seedUser()
    const threadId = await seedThread({ createdBy: author })

    await expect(
      deleteThread({ threadId }, selfActor(stranger), { db }),
    ).rejects.toMatchObject({ code: 'forbidden' })
  })

  it('forbids deleting an Event-Thread', async () => {
    const admin = await seedUser('admin')
    const eventId = await seedEvent()
    const threadId = await seedThread({ createdBy: admin, eventId })

    await expect(
      deleteThread({ threadId }, adminActor(admin), { db }),
    ).rejects.toMatchObject({ code: 'forbidden' })
  })

  it('forbids deleting an already-deleted Beitrag', async () => {
    const userId = await seedUser()
    const threadId = await seedThread({ createdBy: userId })
    await deleteThread({ threadId }, selfActor(userId), { db })

    await expect(
      deleteThread({ threadId }, selfActor(userId), { db }),
    ).rejects.toMatchObject({ code: 'forbidden' })
  })

  it('throws thread_not_found for an unknown id', async () => {
    const userId = await seedUser()

    await expect(
      deleteThread({ threadId: 9999 }, selfActor(userId), { db }),
    ).rejects.toMatchObject({ code: 'thread_not_found' })
  })
})
