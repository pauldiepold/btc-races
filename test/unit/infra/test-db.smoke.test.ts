import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { eq } from 'drizzle-orm'
import { createTestDb, type TestDb } from '../../helpers/test-db'

describe('test-db smoke', () => {
  let testDb: TestDb

  beforeEach(async () => {
    testDb = await createTestDb()
  })

  afterEach(async () => {
    await testDb.cleanup()
  })

  it('migriert das Schema und legt User + Event + Anmeldung an', async () => {
    const { db, schema } = testDb

    const [user] = await db.insert(schema.users).values({
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'member',
      membershipStatus: 'active',
      hasLadvStartpass: 1,
    }).returning()

    expect(user.id).toBeGreaterThan(0)
    expect(user.email).toBe('test@example.com')

    const [event] = await db.insert(schema.events).values({
      type: 'ladv',
      name: 'Test-Wettkampf',
      date: '2026-06-01',
      registrationDeadline: '2026-05-25',
      createdBy: user.id,
    }).returning()

    expect(event.id).toBeGreaterThan(0)
    expect(event.type).toBe('ladv')

    const [registration] = await db.insert(schema.registrations).values({
      eventId: event.id,
      userId: user.id,
      status: 'registered',
      wishDisciplines: [{ discipline: '100m', ageClass: 'M30' }],
    }).returning()

    expect(registration.status).toBe('registered')
    expect(registration.wishDisciplines).toEqual([{ discipline: '100m', ageClass: 'M30' }])

    const loaded = await db.query.registrations.findFirst({
      where: eq(schema.registrations.id, registration.id),
    })
    expect(loaded?.eventId).toBe(event.id)
    expect(loaded?.userId).toBe(user.id)
  })

  it('isoliert DBs zwischen Tests (vorheriger User existiert nicht mehr)', async () => {
    const { db, schema } = testDb
    const found = await db.query.users.findFirst({
      where: eq(schema.users.email, 'test@example.com'),
    })
    expect(found).toBeUndefined()
  })

  it('erzwingt unique-Constraint auf (eventId, userId)', async () => {
    const { db, schema } = testDb

    const [user] = await db.insert(schema.users).values({
      email: 'unique@example.com',
    }).returning()

    const [event] = await db.insert(schema.events).values({
      type: 'training',
      name: 'Lauftraining',
    }).returning()

    await db.insert(schema.registrations).values({
      eventId: event.id,
      userId: user.id,
      status: 'yes',
    })

    await expect(
      db.insert(schema.registrations).values({
        eventId: event.id,
        userId: user.id,
        status: 'maybe',
      }),
    ).rejects.toThrow()
  })
})
