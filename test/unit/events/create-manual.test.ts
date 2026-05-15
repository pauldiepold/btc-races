import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { eq } from 'drizzle-orm'
import {
  createManualEvent,
  type AppDb,
  type EventActor,
} from '~~/server/events'
import { createTestDb, type TestDb } from '../../helpers/test-db'
import { loadNotificationJobs } from '../../helpers/notification-jobs'

let testDb: TestDb
let db: AppDb

beforeEach(async () => {
  testDb = await createTestDb()
  db = testDb.db
})

afterEach(async () => {
  await testDb.cleanup()
})

const FUTURE_DATE = '2099-06-01'

async function seedUser(opts: { role?: 'member' | 'admin' | 'superuser', suffix?: string } = {}): Promise<number> {
  const { schema } = testDb
  const [user] = await testDb.db.insert(schema.users).values({
    email: `user${opts.suffix ?? Date.now()}-${Math.random()}@example.com`,
    firstName: 'Test',
    lastName: 'User',
    role: opts.role ?? 'member',
    membershipStatus: 'active',
    hasLadvStartpass: 0,
  }).returning()
  return user.id
}

async function loadEvent(id: number) {
  const { schema } = testDb
  return testDb.db.query.events.findFirst({ where: eq(schema.events.id, id) })
}

function ownerActor(userId: number): EventActor {
  return { kind: 'owner', userId }
}

function adminActor(userId: number, isSuperuser = false): EventActor {
  return { kind: 'admin', userId, isSuperuser }
}

describe('createManualEvent — Insert + Notification', () => {
  it('Owner legt Event an → Insert + new_event-Notification an alle Mitglieder', async () => {
    const ownerId = await seedUser()
    await seedUser({ suffix: 'member-a' })
    await seedUser({ suffix: 'member-b' })

    const { id } = await createManualEvent(
      { type: 'competition', name: 'Mein Wettkampf', date: FUTURE_DATE, location: 'Berlin' },
      ownerActor(ownerId),
      { db },
    )

    const dbEvent = await loadEvent(id)
    expect(dbEvent).toMatchObject({
      type: 'competition',
      name: 'Mein Wettkampf',
      date: FUTURE_DATE,
      location: 'Berlin',
      createdBy: ownerId,
    })

    const jobs = await loadNotificationJobs(testDb)
    expect(jobs).toHaveLength(1)
    expect(jobs[0]).toMatchObject({ type: 'new_event', actorUserId: ownerId })
    expect(jobs[0].payload.eventName).toBe('Mein Wettkampf')
    const recipientIds = jobs[0].payload._recipients.map(r => r.userId).sort()
    expect(recipientIds).toEqual([ownerId, ownerId + 1, ownerId + 2].sort())
  })

  it('Inaktive Mitglieder bekommen keine new_event-Notification', async () => {
    const { schema } = testDb
    const adminId = await seedUser({ role: 'admin' })
    const [inactive] = await testDb.db.insert(schema.users).values({
      email: `inactive-${Math.random()}@example.com`,
      firstName: 'Old',
      lastName: 'User',
      role: 'member',
      membershipStatus: 'inactive',
      hasLadvStartpass: 0,
    }).returning()

    await createManualEvent(
      { type: 'training', name: 'Bahntraining', date: FUTURE_DATE },
      adminActor(adminId),
      { db },
    )

    const jobs = await loadNotificationJobs(testDb)
    expect(jobs).toHaveLength(1)
    const recipientIds = jobs[0].payload._recipients.map(r => r.userId)
    expect(recipientIds).not.toContain(inactive.id)
  })
})

describe('createManualEvent — Priority-Gating', () => {
  it('Admin + Competition (hasCompetitionMetadata) darf priority setzen', async () => {
    const adminId = await seedUser({ role: 'admin' })

    const { id } = await createManualEvent(
      { type: 'competition', name: 'A-Lauf', date: FUTURE_DATE, priority: 'A' },
      adminActor(adminId),
      { db },
    )

    expect((await loadEvent(id))?.priority).toBe('A')
  })

  it('Superuser + Competition darf priority setzen', async () => {
    const suId = await seedUser({ role: 'superuser' })

    const { id } = await createManualEvent(
      { type: 'competition', name: 'B-Lauf', date: FUTURE_DATE, priority: 'B' },
      adminActor(suId, true),
      { db },
    )

    expect((await loadEvent(id))?.priority).toBe('B')
  })

  it('Owner (kein Admin) mit priority → priority_not_allowed', async () => {
    const ownerId = await seedUser()

    await expect(
      createManualEvent(
        { type: 'competition', name: 'X', date: FUTURE_DATE, priority: 'A' },
        ownerActor(ownerId),
        { db },
      ),
    ).rejects.toMatchObject({ code: 'priority_not_allowed' })

    const jobs = await loadNotificationJobs(testDb)
    expect(jobs).toHaveLength(0)
  })

  it('Admin + Training (kein hasCompetitionMetadata) mit priority → priority_not_allowed', async () => {
    const adminId = await seedUser({ role: 'admin' })

    await expect(
      createManualEvent(
        { type: 'training', name: 'T', date: FUTURE_DATE, priority: 'A' },
        adminActor(adminId),
        { db },
      ),
    ).rejects.toMatchObject({ code: 'priority_not_allowed' })
  })

  it('Owner ohne priority darf trotzdem Competition anlegen → priority bleibt null', async () => {
    const ownerId = await seedUser()

    const { id } = await createManualEvent(
      { type: 'competition', name: 'OK', date: FUTURE_DATE },
      ownerActor(ownerId),
      { db },
    )

    expect((await loadEvent(id))?.priority).toBeNull()
  })
})
