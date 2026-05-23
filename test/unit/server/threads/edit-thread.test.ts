import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { eq } from 'drizzle-orm'
import { editThread, type AppDb, type ThreadActor } from '~~/server/threads'
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
  deletedAt?: Date | null
  lastActivityAt?: Date
} = {}): Promise<number> {
  const [row] = await testDb.db.insert(testDb.schema.threads).values({
    roomSlug: 'training',
    title: 'Original-Titel',
    body: 'Original-Body',
    eventId: opts.eventId ?? null,
    lastActivityAt: opts.lastActivityAt ?? PAST_ACTIVITY,
    deletedAt: opts.deletedAt ?? null,
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

describe('editThread', () => {
  it('updates title and body of the authors own Beitrag', async () => {
    const userId = await seedUser()
    const threadId = await seedThread({ createdBy: userId })

    await editThread(
      { threadId, title: 'Neuer Titel', body: 'Neuer **Body**' },
      selfActor(userId),
      { db },
    )

    expect(await loadThread(threadId)).toMatchObject({
      title: 'Neuer Titel',
      body: 'Neuer **Body**',
    })
  })

  it('does not touch lastActivityAt', async () => {
    const userId = await seedUser()
    const threadId = await seedThread({ createdBy: userId, lastActivityAt: PAST_ACTIVITY })

    await editThread(
      { threadId, title: 'X', body: 'Y' },
      selfActor(userId),
      { db },
    )

    expect((await loadThread(threadId))!.lastActivityAt.getTime()).toBe(PAST_ACTIVITY.getTime())
  })

  it('forbids a non-author non-admin from editing', async () => {
    const author = await seedUser()
    const stranger = await seedUser()
    const threadId = await seedThread({ createdBy: author })

    await expect(
      editThread(
        { threadId, title: 'Hack', body: 'Body' },
        selfActor(stranger),
        { db },
      ),
    ).rejects.toMatchObject({ code: 'forbidden' })
  })

  it('lets an admin edit a foreign Beitrag', async () => {
    const author = await seedUser()
    const admin = await seedUser('admin')
    const threadId = await seedThread({ createdBy: author })

    await editThread(
      { threadId, title: 'Mod-Edit', body: 'Body' },
      adminActor(admin),
      { db },
    )

    expect((await loadThread(threadId))!.title).toBe('Mod-Edit')
  })

  it('forbids editing an Event-Thread even for admins', async () => {
    const admin = await seedUser('admin')
    const eventId = await seedEvent()
    const threadId = await seedThread({ createdBy: admin, eventId })

    await expect(
      editThread(
        { threadId, title: 'X', body: 'Y' },
        adminActor(admin),
        { db },
      ),
    ).rejects.toMatchObject({ code: 'forbidden' })
  })

  it('forbids editing a soft-deleted Beitrag', async () => {
    const userId = await seedUser()
    const threadId = await seedThread({ createdBy: userId, deletedAt: new Date() })

    await expect(
      editThread(
        { threadId, title: 'X', body: 'Y' },
        selfActor(userId),
        { db },
      ),
    ).rejects.toMatchObject({ code: 'forbidden' })
  })

  it('throws thread_not_found for an unknown id', async () => {
    const userId = await seedUser()

    await expect(
      editThread(
        { threadId: 9999, title: 'X', body: 'Y' },
        selfActor(userId),
        { db },
      ),
    ).rejects.toMatchObject({ code: 'thread_not_found' })
  })

  it('rejects a title over 200 characters', async () => {
    const userId = await seedUser()
    const threadId = await seedThread({ createdBy: userId })

    await expect(
      editThread(
        { threadId, title: 'x'.repeat(201), body: 'Body' },
        selfActor(userId),
        { db },
      ),
    ).rejects.toMatchObject({ code: 'thread_too_long' })
  })

  it('rejects a body over 5000 characters', async () => {
    const userId = await seedUser()
    const threadId = await seedThread({ createdBy: userId })

    await expect(
      editThread(
        { threadId, title: 'OK', body: 'x'.repeat(5001) },
        selfActor(userId),
        { db },
      ),
    ).rejects.toMatchObject({ code: 'thread_too_long' })
  })
})
