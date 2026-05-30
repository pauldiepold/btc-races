import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getMemberAdminOverview, getMemberRegistrations } from '~~/server/members/admin-overview'
import { encodeEventId } from '~~/server/utils/sqids'
import { createTestDb, type TestDb } from '../../../helpers/test-db'

const NOW = new Date('2026-05-30T12:00:00Z')

let testDb: TestDb
let db: TestDb['db']

beforeEach(async () => {
  testDb = await createTestDb()
  db = testDb.db
})

afterEach(async () => {
  await testDb.cleanup()
})

type SeedUserOpts = {
  firstName?: string
  lastName?: string
  role?: 'member' | 'admin' | 'superuser'
  campaiId?: string | null
  lastSyncedAt?: Date | null
  membershipStatus?: 'active' | 'inactive'
}

let emailSeq = 0

async function seedUser(opts: SeedUserOpts = {}): Promise<number> {
  const { schema } = testDb
  const [user] = await db.insert(schema.users).values({
    email: `user${emailSeq++}@example.com`,
    firstName: opts.firstName ?? 'Test',
    lastName: opts.lastName ?? 'User',
    role: opts.role ?? 'member',
    campaiId: opts.campaiId ?? null,
    lastSyncedAt: opts.lastSyncedAt ?? null,
    membershipStatus: opts.membershipStatus ?? 'active',
  }).returning()
  return user.id
}

async function seedEvent(createdBy: number, opts: { name?: string, date?: string } = {}): Promise<number> {
  const { schema } = testDb
  const [event] = await db.insert(schema.events).values({
    type: 'ladv',
    name: opts.name ?? 'Test-Event',
    date: opts.date ?? '2026-07-01',
    registrationDeadline: '2026-06-20',
    createdBy,
  }).returning()
  return event.id
}

async function seedPushDevice(userId: number, endpoint: string): Promise<void> {
  const { schema } = testDb
  await db.insert(schema.pushSubscriptions).values({
    userId,
    endpoint,
    keysAuth: 'auth',
    keysP256dh: 'p256dh',
  })
}

async function seedRegistration(eventId: number, userId: number): Promise<void> {
  const { schema } = testDb
  await db.insert(schema.registrations).values({
    eventId,
    userId,
    status: 'registered',
  })
}

describe('getMemberAdminOverview', () => {
  it('returns one item per user with derived sync state and zero counts', async () => {
    const userId = await seedUser({
      campaiId: 'c1',
      lastSyncedAt: new Date(NOW.getTime() - 60 * 60 * 1000), // 1h ago
    })

    const result = await getMemberAdminOverview(db, NOW)

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      id: userId,
      syncState: 'synced',
      pushDeviceCount: 0,
      registrationCount: 0,
    })
  })

  it('reports never for a member that was never synced from Campai', async () => {
    await seedUser({ campaiId: null })
    const [item] = await getMemberAdminOverview(db, NOW)
    expect(item.syncState).toBe('never')
  })

  it('counts active push devices per member', async () => {
    const userId = await seedUser()
    await seedPushDevice(userId, 'https://push/1')
    await seedPushDevice(userId, 'https://push/2')

    const [item] = await getMemberAdminOverview(db, NOW)
    expect(item.pushDeviceCount).toBe(2)
  })

  it('counts event registrations per member', async () => {
    const userId = await seedUser()
    const e1 = await seedEvent(userId)
    const e2 = await seedEvent(userId)
    await seedRegistration(e1, userId)
    await seedRegistration(e2, userId)

    const [item] = await getMemberAdminOverview(db, NOW)
    expect(item.registrationCount).toBe(2)
  })

  it('orders members by last name, then first name', async () => {
    await seedUser({ firstName: 'Anna', lastName: 'Zimmer' })
    await seedUser({ firstName: 'Bea', lastName: 'Albers' })
    await seedUser({ firstName: 'Carl', lastName: 'Albers' })

    const names = (await getMemberAdminOverview(db, NOW)).map(m => `${m.lastName} ${m.firstName}`)
    expect(names).toEqual(['Albers Bea', 'Albers Carl', 'Zimmer Anna'])
  })
})

describe('getMemberRegistrations', () => {
  it('lists the events a member is registered for, soonest first', async () => {
    const userId = await seedUser()
    const later = await seedEvent(userId, { name: 'Spätes Event', date: '2026-08-15' })
    const sooner = await seedEvent(userId, { name: 'Frühes Event', date: '2026-07-01' })
    await seedRegistration(later, userId)
    await seedRegistration(sooner, userId)

    const regs = await getMemberRegistrations(db, userId)

    expect(regs.map(r => r.eventName)).toEqual(['Frühes Event', 'Spätes Event'])
    expect(regs[0]).toMatchObject({ eventId: sooner, status: 'registered' })
  })

  it('exposes the encoded event id for linking to the event detail page', async () => {
    const userId = await seedUser()
    const eventId = await seedEvent(userId)
    await seedRegistration(eventId, userId)

    const [reg] = await getMemberRegistrations(db, userId)
    expect(reg.eventSlug).toBe(encodeEventId(eventId))
  })

  it('returns an empty list for a member without registrations', async () => {
    const userId = await seedUser()
    expect(await getMemberRegistrations(db, userId)).toEqual([])
  })
})
