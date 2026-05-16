import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { eq } from 'drizzle-orm'
import {
  importEventFromLadv,
  type AppDb,
  type EventActor,
} from '~~/server/events'
import type { LadvAusschreibung, NormalizedLadvData } from '~~/shared/types/ladv'
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

async function seedUser(opts: { role?: 'member' | 'admin' | 'superuser', suffix?: string, status?: 'active' | 'inactive' } = {}): Promise<number> {
  const { schema } = testDb
  const [user] = await testDb.db.insert(schema.users).values({
    email: `user${opts.suffix ?? Date.now()}-${Math.random()}@example.com`,
    firstName: 'Test',
    lastName: 'User',
    role: opts.role ?? 'member',
    membershipStatus: opts.status ?? 'active',
    hasLadvStartpass: 0,
  }).returning()
  return user.id
}

async function loadEvent(id: number) {
  const { schema } = testDb
  return testDb.db.query.events.findFirst({ where: eq(schema.events.id, id) })
}

function adminActor(userId: number): EventActor {
  return { kind: 'admin', userId }
}

function makeLadvData(overrides: Partial<NormalizedLadvData> = {}): NormalizedLadvData {
  const rawData: LadvAusschreibung = {
    id: 42008,
    name: 'Abendsportfest Berlin-Zehlendorf',
    sportstaette: 'Stadion Lichterfelde',
    meldAdresse: null,
    meldEmail: null,
    veranstalter: 'LG Nord',
    ausrichter: 'LG Nord',
    beschreibung: 'Beschreibung',
    datum: 1748966400000,
    datumText: '03.06.2025',
    meldDatum: 1748275200000,
    meldDatumText: '26.05.2025',
    abgesagt: false,
    url: 'https://ladv.de/ausschreibung/detail/42008/Abendsportfest.htm',
    tags: '',
    kategorien: ['bahn'],
    ort: { id: 1, name: 'Berlin', lv: 'BLN', land: 'DE', lng: 0, lat: 0 },
    veranstaltungen: [],
    lvs: 'BLN',
    landesverband: ['BLN'],
    links: [],
    attachements: [],
    wettbewerbe: [],
  }
  return {
    name: 'Abendsportfest Berlin-Zehlendorf',
    date: '2025-06-03',
    start_time: '18:00',
    location: 'Berlin · Stadion Lichterfelde',
    registration_deadline: '2025-05-26',
    race_type: 'track',
    is_wrc: 0,
    championship_type: null,
    ladv_data: rawData,
    ...overrides,
  }
}

describe('importEventFromLadv — Insert + Notification', () => {
  it('Insert + new_event-Notification an alle aktiven Mitglieder', async () => {
    const adminId = await seedUser({ role: 'admin' })
    await seedUser({ suffix: 'member-a' })
    await seedUser({ suffix: 'member-b' })

    const { id } = await importEventFromLadv(
      { eventType: 'ladv', ladvId: 42008, ladvData: makeLadvData() },
      adminActor(adminId),
      { db },
    )

    const dbEvent = await loadEvent(id)
    expect(dbEvent).toMatchObject({
      type: 'ladv',
      name: 'Abendsportfest Berlin-Zehlendorf',
      date: '2025-06-03',
      startTime: '18:00',
      location: 'Berlin · Stadion Lichterfelde',
      registrationDeadline: '2025-05-26',
      raceType: 'track',
      isWrc: 0,
      ladvId: 42008,
      createdBy: adminId,
    })

    const jobs = await loadNotificationJobs(testDb)
    expect(jobs).toHaveLength(1)
    expect(jobs[0]).toMatchObject({ type: 'new_event', actorUserId: adminId })
    expect(jobs[0].payload.eventName).toBe('Abendsportfest Berlin-Zehlendorf')
    const recipientIds = jobs[0].payload._recipients.map(r => r.userId).sort()
    expect(recipientIds).toEqual([adminId, adminId + 1, adminId + 2].sort())
  })

  it('Inaktive Mitglieder bekommen keine new_event-Notification', async () => {
    const adminId = await seedUser({ role: 'admin' })
    const inactiveId = await seedUser({ suffix: 'inactive', status: 'inactive' })

    await importEventFromLadv(
      { eventType: 'ladv', ladvId: 12345, ladvData: makeLadvData() },
      adminActor(adminId),
      { db },
    )

    const jobs = await loadNotificationJobs(testDb)
    expect(jobs).toHaveLength(1)
    const recipientIds = jobs[0].payload._recipients.map(r => r.userId)
    expect(recipientIds).not.toContain(inactiveId)
  })
})

describe('importEventFromLadv — LADV-Felder', () => {
  it('setzt ladvId, ladvData (raw) und ladvLastSync', async () => {
    const adminId = await seedUser({ role: 'admin' })
    const normalized = makeLadvData()

    const before = Date.now()
    const { id } = await importEventFromLadv(
      { eventType: 'ladv', ladvId: 99999, ladvData: normalized },
      adminActor(adminId),
      { db },
    )
    const after = Date.now()

    const dbEvent = await loadEvent(id)
    expect(dbEvent?.ladvId).toBe(99999)
    expect(dbEvent?.ladvData).toEqual(normalized.ladv_data)
    expect(dbEvent?.ladvLastSync).toBeInstanceOf(Date)
    const ts = dbEvent!.ladvLastSync!.getTime()
    expect(ts).toBeGreaterThanOrEqual(before - 1000)
    expect(ts).toBeLessThanOrEqual(after + 1000)
  })

  it('startTime kann null sein (LADV liefert keine echte Uhrzeit)', async () => {
    const adminId = await seedUser({ role: 'admin' })

    const { id } = await importEventFromLadv(
      { eventType: 'ladv', ladvId: 77, ladvData: makeLadvData({ start_time: null }) },
      adminActor(adminId),
      { db },
    )

    expect((await loadEvent(id))?.startTime).toBeNull()
  })
})

describe('importEventFromLadv — Event-Typ-Wahl', () => {
  it('eventType "ladv" wird durchgereicht', async () => {
    const adminId = await seedUser({ role: 'admin' })

    const { id } = await importEventFromLadv(
      { eventType: 'ladv', ladvId: 1, ladvData: makeLadvData() },
      adminActor(adminId),
      { db },
    )

    expect((await loadEvent(id))?.type).toBe('ladv')
  })

  it('eventType "ladv_external" wird durchgereicht', async () => {
    const adminId = await seedUser({ role: 'admin' })

    const { id } = await importEventFromLadv(
      { eventType: 'ladv_external', ladvId: 2, ladvData: makeLadvData() },
      adminActor(adminId),
      { db },
    )

    expect((await loadEvent(id))?.type).toBe('ladv_external')
  })
})

describe('importEventFromLadv — Dedup', () => {
  it('Doppelter Import (gleiche ladvId) wirft ladv_id_already_imported mit existingEventId', async () => {
    const adminId = await seedUser({ role: 'admin' })

    const first = await importEventFromLadv(
      { eventType: 'ladv', ladvId: 555, ladvData: makeLadvData() },
      adminActor(adminId),
      { db },
    )

    await expect(
      importEventFromLadv(
        { eventType: 'ladv', ladvId: 555, ladvData: makeLadvData() },
        adminActor(adminId),
        { db },
      ),
    ).rejects.toMatchObject({
      code: 'ladv_id_already_imported',
      data: { existingEventId: first.id },
    })

    const jobs = await loadNotificationJobs(testDb)
    expect(jobs).toHaveLength(1)
  })
})
