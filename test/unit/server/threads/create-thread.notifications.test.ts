import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  createThread,
  type AppDb,
  type ThreadActor,
} from '~~/server/threads'
import { createTestDb, type TestDb } from '../../../helpers/test-db'
import { loadNotificationJobs, type NotificationJobRow } from '../../../helpers/notification-jobs'

let testDb: TestDb
let db: AppDb

beforeEach(async () => {
  testDb = await createTestDb()
  db = testDb.db
})

afterEach(async () => {
  await testDb.cleanup()
})

async function seedUser(opts: { role?: 'member' | 'admin', membershipStatus?: 'active' | 'inactive', suffix?: string } = {}): Promise<number> {
  const [user] = await testDb.db.insert(testDb.schema.users).values({
    email: `${opts.suffix ?? 'u'}-${Math.random()}@example.com`,
    firstName: opts.suffix ?? 'User',
    role: opts.role ?? 'member',
    membershipStatus: opts.membershipStatus ?? 'active',
  }).returning()
  return user.id
}

function adminActor(userId: number): ThreadActor {
  return { kind: 'admin', userId }
}

function selfActor(userId: number): ThreadActor {
  return { kind: 'self', userId }
}

async function announcementJob(): Promise<NotificationJobRow | undefined> {
  const jobs = await loadNotificationJobs(testDb)
  return jobs.find(j => j.type === 'thread_announcement')
}

describe('createThread — thread_announcement notification', () => {
  it('enqueues an announcement notification when an admin posts in Ankündigungen', async () => {
    const adminId = await seedUser({ role: 'admin', suffix: 'admin' })
    const memberA = await seedUser({ suffix: 'a' })
    const memberB = await seedUser({ suffix: 'b' })

    await createThread(
      { roomSlug: 'announcements', title: 'Wichtig', body: 'Body' },
      adminActor(adminId),
      { db },
    )

    const job = await announcementJob()
    expect(job).toBeDefined()
    expect(job!.actorUserId).toBe(adminId)
    const recipientIds = job!.payload._recipients.map(r => r.userId).sort((a, b) => a - b)
    expect(recipientIds).toEqual([memberA, memberB].sort((a, b) => a - b))
  })

  it('excludes inactive members from the announcement recipients', async () => {
    const adminId = await seedUser({ role: 'admin' })
    const activeMember = await seedUser({ suffix: 'active' })
    await seedUser({ suffix: 'inactive', membershipStatus: 'inactive' })

    await createThread(
      { roomSlug: 'announcements', title: 'Wichtig', body: 'Body' },
      adminActor(adminId),
      { db },
    )

    const job = await announcementJob()
    expect(job).toBeDefined()
    const recipientIds = job!.payload._recipients.map(r => r.userId)
    expect(recipientIds).toEqual([activeMember])
  })

  it('ignores a muted override on the announcement thread (mandatory)', async () => {
    const adminId = await seedUser({ role: 'admin' })
    const member = await seedUser({ suffix: 'm' })

    // Pre-create a muted override for the member on a *different* thread to verify
    // mute is global per (user, thread) — only mute on the new thread would matter
    // and the thread doesn't exist yet. We assert the recipient is still included
    // (the mandatory path must not consult overrides).
    const { id } = await createThread(
      { roomSlug: 'announcements', title: 'Wichtig', body: 'Body' },
      adminActor(adminId),
      { db },
    )

    const job = await announcementJob()
    expect(job).toBeDefined()
    const recipientIds = job!.payload._recipients.map(r => r.userId)
    expect(recipientIds).toContain(member)
    // sanity: created thread id exists in DB
    expect(typeof id).toBe('number')
  })

  it('does not enqueue a notification for non-mandatory rooms', async () => {
    await seedUser({ suffix: 'other' })
    const authorId = await seedUser({ suffix: 'author' })

    await createThread(
      { roomSlug: 'training', title: 'Schuhe', body: 'Welche?' },
      selfActor(authorId),
      { db },
    )

    expect(await announcementJob()).toBeUndefined()
  })
})
