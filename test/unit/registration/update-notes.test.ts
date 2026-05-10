import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { eq } from 'drizzle-orm'
import {
  updateRegistrationNotes,
  type Actor,
  type AppDb,
  type Notifier,
} from '~~/server/registration'
import type { EventType, RegistrationStatus } from '~~/shared/utils/registration'
import { createTestDb, type TestDb } from '../../helpers/test-db'
import { createRecorderNotifier } from '../../helpers/recorder-notifier'

let testDb: TestDb
let db: AppDb
let recorder: ReturnType<typeof createRecorderNotifier>
let notifier: Notifier

beforeEach(async () => {
  testDb = await createTestDb()
  db = testDb.db as unknown as AppDb
  recorder = createRecorderNotifier()
  notifier = recorder.notifier
})

afterEach(async () => {
  await testDb.cleanup()
})

async function seedUser(opts: { emailSuffix?: string } = {}): Promise<number> {
  const { schema } = testDb
  const [user] = await testDb.db.insert(schema.users).values({
    email: `user${opts.emailSuffix ?? Date.now()}-${Math.random()}@example.com`,
    firstName: 'Test',
    lastName: 'User',
    role: 'member',
    membershipStatus: 'active',
    hasLadvStartpass: 0,
  }).returning()
  return user.id
}

async function seedEvent(createdBy: number, type: EventType = 'competition'): Promise<number> {
  const { schema } = testDb
  const [event] = await testDb.db.insert(schema.events).values({
    type,
    name: 'Test-Event',
    date: '2026-06-01',
    registrationDeadline: '2026-05-25',
    createdBy,
  }).returning()
  return event.id
}

async function seedRegistration(
  eventId: number,
  userId: number,
  status: RegistrationStatus = 'registered',
  notes: string | null = null,
): Promise<number> {
  const { schema } = testDb
  const [reg] = await testDb.db.insert(schema.registrations).values({
    eventId, userId, status, notes,
    wishDisciplines: [],
    ladvDisciplines: null,
  }).returning()
  return reg.id
}

async function loadReg(id: number) {
  const { schema } = testDb
  return testDb.db.query.registrations.findFirst({
    where: eq(schema.registrations.id, id),
  })
}

function selfActor(userId: number): Actor {
  return { kind: 'self', userId, hasLadvStartpass: false }
}

function adminActor(userId: number): Actor {
  return { kind: 'admin', userId }
}

describe('updateRegistrationNotes', () => {
  it('Self ändert eigene Notes: persistiert, keine Decision', async () => {
    const userId = await seedUser()
    const eventId = await seedEvent(userId)
    const regId = await seedRegistration(eventId, userId)

    await updateRegistrationNotes(
      { registrationId: regId, notes: 'meine Notiz' },
      selfActor(userId),
      { db, notifier },
    )

    expect((await loadReg(regId))?.notes).toBe('meine Notiz')
    expect(recorder.decisions).toHaveLength(0)
  })

  it('Admin ändert fremde Notes: admin_changed_member_registration', async () => {
    const adminId = await seedUser({ emailSuffix: 'admin' })
    const memberId = await seedUser({ emailSuffix: 'member' })
    const eventId = await seedEvent(adminId)
    const regId = await seedRegistration(eventId, memberId)

    await updateRegistrationNotes(
      { registrationId: regId, notes: 'admin notiz' },
      adminActor(adminId),
      { db, notifier },
    )

    expect((await loadReg(regId))?.notes).toBe('admin notiz')
    expect(recorder.decisions).toHaveLength(1)
    expect(recorder.decisions[0]).toMatchObject({
      type: 'admin_changed_member_registration',
      userId: memberId,
    })
  })

  it('Admin ändert fremde Notes + silent: keine Decision', async () => {
    const adminId = await seedUser({ emailSuffix: 'admin' })
    const memberId = await seedUser({ emailSuffix: 'member' })
    const eventId = await seedEvent(adminId)
    const regId = await seedRegistration(eventId, memberId)

    await updateRegistrationNotes(
      { registrationId: regId, notes: 'foo' },
      adminActor(adminId),
      { db, notifier },
      { silent: true },
    )

    expect(recorder.decisions).toHaveLength(0)
  })

  it('Admin ändert eigene Notes: keine Decision', async () => {
    const adminId = await seedUser({ emailSuffix: 'admin' })
    const eventId = await seedEvent(adminId)
    const regId = await seedRegistration(eventId, adminId)

    await updateRegistrationNotes(
      { registrationId: regId, notes: 'eigene notiz' },
      adminActor(adminId),
      { db, notifier },
    )

    expect(recorder.decisions).toHaveLength(0)
  })

  it('Self auf fremde Reg: forbidden', async () => {
    const ownerId = await seedUser({ emailSuffix: 'owner' })
    const otherId = await seedUser({ emailSuffix: 'other' })
    const eventId = await seedEvent(ownerId)
    const regId = await seedRegistration(eventId, ownerId)

    await expect(updateRegistrationNotes(
      { registrationId: regId, notes: 'foo' },
      selfActor(otherId),
      { db, notifier },
    )).rejects.toMatchObject({ code: 'forbidden' })
  })

  it('notes: null löscht bestehende Notes', async () => {
    const userId = await seedUser()
    const eventId = await seedEvent(userId)
    const regId = await seedRegistration(eventId, userId, 'registered', 'alte notiz')

    await updateRegistrationNotes(
      { registrationId: regId, notes: null },
      selfActor(userId),
      { db, notifier },
    )

    expect((await loadReg(regId))?.notes).toBeNull()
  })

  it('Nicht existierende Reg: registration_not_found', async () => {
    await expect(updateRegistrationNotes(
      { registrationId: 99999, notes: 'foo' },
      selfActor(1),
      { db, notifier },
    )).rejects.toMatchObject({ code: 'registration_not_found' })
  })
})
