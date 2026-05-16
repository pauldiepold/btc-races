import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { eq } from 'drizzle-orm'
import {
  applyEventPatch,
  type AppDb,
  type EventActor,
} from '~~/server/events'
import type { EventType } from '~~/shared/utils/registration'
import { createTestDb, type TestDb } from '../../../helpers/test-db'
import { loadNotificationJobs } from '../../../helpers/notification-jobs'

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

type SeedEventOpts = {
  type?: EventType
  createdBy: number
  date?: string | null
  startTime?: string | null
  location?: string | null
  description?: string | null
  priority?: 'A' | 'B' | 'C' | null
}

async function seedEvent(opts: SeedEventOpts): Promise<number> {
  const { schema } = testDb
  const [event] = await testDb.db.insert(schema.events).values({
    type: opts.type ?? 'competition',
    name: 'Test-Event',
    date: opts.date ?? FUTURE_DATE,
    startTime: opts.startTime ?? null,
    location: opts.location ?? null,
    description: opts.description ?? null,
    priority: opts.priority ?? null,
    createdBy: opts.createdBy,
  }).returning()
  return event.id
}

async function seedRegisteredAttendee(eventId: number): Promise<number> {
  const { schema } = testDb
  const userId = await seedUser({ suffix: `attendee-${Math.random()}` })
  await testDb.db.insert(schema.registrations).values({
    eventId,
    userId,
    status: 'registered',
    notes: null,
    wishDisciplines: [],
    ladvDisciplines: null,
  })
  return userId
}

async function loadEvent(id: number) {
  const { schema } = testDb
  return testDb.db.query.events.findFirst({ where: eq(schema.events.id, id) })
}

function selfActor(userId: number): EventActor {
  return { kind: 'self', userId }
}

function adminActor(userId: number): EventActor {
  return { kind: 'admin', userId }
}

describe('applyEventPatch — Core-Field-Notifications', () => {
  it('Core-Field-Change (date) → event_changed-Notification an Angemeldete', async () => {
    const ownerId = await seedUser()
    const eventId = await seedEvent({ createdBy: ownerId, date: FUTURE_DATE, location: 'Berlin' })
    await seedRegisteredAttendee(eventId)

    await applyEventPatch(eventId, { date: '2099-07-01' }, selfActor(ownerId), { db })

    expect((await loadEvent(eventId))?.date).toBe('2099-07-01')
    const jobs = await loadNotificationJobs(testDb)
    expect(jobs).toHaveLength(1)
    expect(jobs[0]).toMatchObject({ type: 'event_changed', actorUserId: ownerId })
  })

  it('Core-Field-Change (location) → event_changed', async () => {
    const ownerId = await seedUser()
    const eventId = await seedEvent({ createdBy: ownerId, location: 'Berlin' })
    await seedRegisteredAttendee(eventId)

    await applyEventPatch(eventId, { location: 'Potsdam' }, selfActor(ownerId), { db })

    const jobs = await loadNotificationJobs(testDb)
    expect(jobs).toHaveLength(1)
    expect(jobs[0].type).toBe('event_changed')
  })

  it('Nicht-Core-Change (description) → keine Notification', async () => {
    const ownerId = await seedUser()
    const eventId = await seedEvent({ createdBy: ownerId, description: 'alt' })
    await seedRegisteredAttendee(eventId)

    await applyEventPatch(eventId, { description: 'neu' }, selfActor(ownerId), { db })

    expect((await loadEvent(eventId))?.description).toBe('neu')
    expect(await loadNotificationJobs(testDb)).toHaveLength(0)
  })

  it('opts.silent = true unterdrückt auch bei Core-Field-Change', async () => {
    const ownerId = await seedUser()
    const adminId = await seedUser({ role: 'superuser', suffix: 'admin' })
    const eventId = await seedEvent({ createdBy: ownerId, date: FUTURE_DATE })
    await seedRegisteredAttendee(eventId)

    await applyEventPatch(
      eventId,
      { date: '2099-07-01' },
      adminActor(adminId),
      { db },
      { silent: true },
    )

    expect((await loadEvent(eventId))?.date).toBe('2099-07-01')
    expect(await loadNotificationJobs(testDb)).toHaveLength(0)
  })

  it('Keine Angemeldeten → keine Notification, Update läuft trotzdem', async () => {
    const ownerId = await seedUser()
    const eventId = await seedEvent({ createdBy: ownerId, date: FUTURE_DATE })

    await applyEventPatch(eventId, { date: '2099-07-01' }, selfActor(ownerId), { db })

    expect((await loadEvent(eventId))?.date).toBe('2099-07-01')
    expect(await loadNotificationJobs(testDb)).toHaveLength(0)
  })
})

describe('applyEventPatch — Priority-Gating', () => {
  it('Admin + Competition (hasCompetitionMetadata) darf priority setzen', async () => {
    const adminId = await seedUser({ role: 'admin' })
    const eventId = await seedEvent({ createdBy: adminId, type: 'competition' })

    await applyEventPatch(eventId, { priority: 'A' }, adminActor(adminId), { db })

    expect((await loadEvent(eventId))?.priority).toBe('A')
  })

  it('Superuser + Competition darf priority setzen', async () => {
    const suId = await seedUser({ role: 'superuser' })
    const eventId = await seedEvent({ createdBy: suId, type: 'competition' })

    await applyEventPatch(eventId, { priority: 'B' }, adminActor(suId), { db })

    expect((await loadEvent(eventId))?.priority).toBe('B')
  })

  it('Owner (kein Admin) darf priority NICHT setzen → priority_not_allowed', async () => {
    const ownerId = await seedUser()
    const eventId = await seedEvent({ createdBy: ownerId, type: 'competition' })

    await expect(
      applyEventPatch(eventId, { priority: 'A' }, selfActor(ownerId), { db }),
    ).rejects.toMatchObject({ code: 'priority_not_allowed' })

    expect((await loadEvent(eventId))?.priority).toBeNull()
  })

  it('Admin + Training (kein hasCompetitionMetadata) → priority_not_allowed', async () => {
    const adminId = await seedUser({ role: 'admin' })
    const eventId = await seedEvent({ createdBy: adminId, type: 'training' })

    await expect(
      applyEventPatch(eventId, { priority: 'A' }, adminActor(adminId), { db }),
    ).rejects.toMatchObject({ code: 'priority_not_allowed' })
  })

  it('priority: null explizit setzen funktioniert bei Admin + Competition', async () => {
    const adminId = await seedUser({ role: 'admin' })
    const eventId = await seedEvent({ createdBy: adminId, type: 'competition', priority: 'A' })

    await applyEventPatch(eventId, { priority: null }, adminActor(adminId), { db })

    expect((await loadEvent(eventId))?.priority).toBeNull()
  })
})

describe('applyEventPatch — Authorization', () => {
  it('Fremder Owner ohne Admin-Rolle → forbidden', async () => {
    const ownerId = await seedUser({ suffix: 'owner' })
    const strangerId = await seedUser({ suffix: 'stranger' })
    const eventId = await seedEvent({ createdBy: ownerId })

    await expect(
      applyEventPatch(eventId, { name: 'Hijack' }, selfActor(strangerId), { db }),
    ).rejects.toMatchObject({ code: 'forbidden' })

    expect((await loadEvent(eventId))?.name).toBe('Test-Event')
  })

  it('Admin darf fremdes Event patchen', async () => {
    const ownerId = await seedUser({ suffix: 'owner' })
    const adminId = await seedUser({ role: 'admin', suffix: 'admin' })
    const eventId = await seedEvent({ createdBy: ownerId })

    await applyEventPatch(eventId, { name: 'Neuer Name' }, adminActor(adminId), { db })

    expect((await loadEvent(eventId))?.name).toBe('Neuer Name')
  })

  it('Unbekannte Event-ID → event_not_found', async () => {
    const ownerId = await seedUser()

    await expect(
      applyEventPatch(99999, { name: 'foo' }, selfActor(ownerId), { db }),
    ).rejects.toMatchObject({ code: 'event_not_found' })
  })
})
