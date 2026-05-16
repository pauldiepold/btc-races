import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { eq } from 'drizzle-orm'
import {
  deleteEvent,
  type AppDb,
  type EventActor,
} from '~~/server/events'
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

async function seedEvent(opts: { createdBy: number }): Promise<number> {
  const { schema } = testDb
  const [event] = await testDb.db.insert(schema.events).values({
    type: 'competition',
    name: 'Test-Event',
    date: FUTURE_DATE,
    createdBy: opts.createdBy,
  }).returning()
  return event.id
}

async function seedRegistration(eventId: number, userId: number): Promise<number> {
  const { schema } = testDb
  const [row] = await testDb.db.insert(schema.registrations).values({
    eventId,
    userId,
    status: 'registered',
    notes: null,
    wishDisciplines: [],
    ladvDisciplines: null,
  }).returning()
  return row.id
}

async function loadEvent(id: number) {
  const { schema } = testDb
  return testDb.db.query.events.findFirst({ where: eq(schema.events.id, id) })
}

async function loadRegistration(id: number) {
  const { schema } = testDb
  return testDb.db.query.registrations.findFirst({ where: eq(schema.registrations.id, id) })
}

function selfActor(userId: number): EventActor {
  return { kind: 'self', userId }
}

function adminActor(userId: number): EventActor {
  return { kind: 'admin', userId }
}

describe('deleteEvent', () => {
  it('Admin löscht Event inkl. kaskadierender Anmeldungen', async () => {
    const adminId = await seedUser({ role: 'admin' })
    const memberId = await seedUser({ suffix: 'member' })
    const eventId = await seedEvent({ createdBy: adminId })
    const regId = await seedRegistration(eventId, memberId)

    await deleteEvent(eventId, adminActor(adminId), { db })

    expect(await loadEvent(eventId)).toBeUndefined()
    expect(await loadRegistration(regId)).toBeUndefined()
  })

  it('Self → forbidden', async () => {
    const userId = await seedUser()
    const eventId = await seedEvent({ createdBy: userId })

    await expect(
      deleteEvent(eventId, selfActor(userId), { db }),
    ).rejects.toMatchObject({ code: 'forbidden' })

    expect(await loadEvent(eventId)).toBeDefined()
  })

  it('Unbekanntes Event → event_not_found (nicht idempotent)', async () => {
    const adminId = await seedUser({ role: 'admin' })

    await expect(
      deleteEvent(99999, adminActor(adminId), { db }),
    ).rejects.toMatchObject({ code: 'event_not_found' })
  })
})
