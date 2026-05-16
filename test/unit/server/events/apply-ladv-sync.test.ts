import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { eq } from 'drizzle-orm'
import {
  applyLadvSync,
  type AppDb,
  type EventRow,
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

async function seedUser(opts: { suffix?: string } = {}): Promise<number> {
  const { schema } = testDb
  const [user] = await testDb.db.insert(schema.users).values({
    email: `user${opts.suffix ?? Date.now()}-${Math.random()}@example.com`,
    firstName: 'Test',
    lastName: 'User',
    role: 'member',
    membershipStatus: 'active',
    hasLadvStartpass: 0,
  }).returning()
  return user.id
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

async function loadEvent(id: number): Promise<EventRow | undefined> {
  const { schema } = testDb
  return testDb.db.query.events.findFirst({ where: eq(schema.events.id, id) })
}

function makeRaw(overrides: Partial<LadvAusschreibung> = {}): LadvAusschreibung {
  return {
    id: 42008,
    name: 'Abendsportfest Berlin',
    sportstaette: 'Stadion Lichterfelde',
    meldAdresse: null,
    meldEmail: null,
    veranstalter: 'LG Nord',
    ausrichter: 'LG Nord',
    beschreibung: '',
    datum: new Date('2099-06-03T18:00:00+02:00').getTime(),
    datumText: '03.06.2099',
    meldDatum: new Date('2099-05-26T00:00:00+02:00').getTime(),
    meldDatumText: '26.05.2099',
    abgesagt: false,
    url: 'https://ladv.de/ausschreibung/detail/42008/x.htm',
    tags: '',
    kategorien: ['bahn'],
    ort: { id: 1, name: 'Berlin', lv: 'BLN', land: 'DE', lng: 0, lat: 0 },
    veranstaltungen: [],
    lvs: 'BLN',
    landesverband: ['BLN'],
    links: [],
    attachements: [],
    wettbewerbe: [],
    ...overrides,
  }
}

function makeLadvData(overrides: Partial<NormalizedLadvData> = {}, rawOverrides: Partial<LadvAusschreibung> = {}): NormalizedLadvData {
  const raw = makeRaw(rawOverrides)
  return {
    name: raw.name,
    date: '2099-06-03',
    start_time: '18:00',
    location: 'Berlin · Stadion Lichterfelde',
    registration_deadline: '2099-05-26',
    race_type: 'track',
    is_wrc: 0,
    championship_type: null,
    ladv_data: raw,
    ...overrides,
  }
}

type SeedLadvEventOpts = {
  createdBy: number
  ladvId?: number
  name?: string
  date?: string
  startTime?: string | null
  location?: string
  registrationDeadline?: string
  raceType?: 'track' | 'road' | 'trail'
  isWrc?: 0 | 1
  ladvData?: LadvAusschreibung
  cancelledAt?: Date | null
}

async function seedLadvEvent(opts: SeedLadvEventOpts): Promise<EventRow> {
  const { schema } = testDb
  const raw = opts.ladvData ?? makeRaw()
  const [event] = await testDb.db.insert(schema.events).values({
    type: 'ladv',
    name: opts.name ?? 'Abendsportfest Berlin',
    date: opts.date ?? '2099-06-03',
    startTime: opts.startTime ?? '18:00',
    location: opts.location ?? 'Berlin · Stadion Lichterfelde',
    registrationDeadline: opts.registrationDeadline ?? '2099-05-26',
    raceType: opts.raceType ?? 'track',
    isWrc: opts.isWrc ?? 0,
    ladvId: opts.ladvId ?? 42008,
    ladvData: raw,
    ladvLastSync: new Date('2024-01-01T00:00:00Z'),
    cancelledAt: opts.cancelledAt ?? null,
    createdBy: opts.createdBy,
  }).returning()
  return event!
}

describe('applyLadvSync — Protected-Felder', () => {
  it('Protected-Feld ohne Override wird vom LADV-Update überschrieben', async () => {
    const ownerId = await seedUser()
    const dbEvent = await seedLadvEvent({ createdBy: ownerId, name: 'Abendsportfest Berlin' })

    const ladv = makeLadvData({ name: 'Abendsportfest Berlin — neuer Name' }, { name: 'Abendsportfest Berlin — neuer Name' })
    await applyLadvSync(dbEvent, ladv, { db })

    const after = await loadEvent(dbEvent.id)
    expect(after?.name).toBe('Abendsportfest Berlin — neuer Name')
  })

  it('Manueller Override eines Protected-Feldes bleibt beim Sync erhalten', async () => {
    const ownerId = await seedUser()
    const dbEvent = await seedLadvEvent({
      createdBy: ownerId,
      name: 'Manuell umbenannt durch Admin',
      ladvData: makeRaw({ name: 'Original LADV-Name' }),
    })

    const ladv = makeLadvData({ name: 'Neuer LADV-Name' }, { name: 'Neuer LADV-Name' })
    await applyLadvSync(dbEvent, ladv, { db })

    const after = await loadEvent(dbEvent.id)
    expect(after?.name).toBe('Manuell umbenannt durch Admin')
  })
})

describe('applyLadvSync — cancelledAt', () => {
  it('setzt cancelledAt, wenn LADV abgesagt = true und Feld leer ist', async () => {
    const ownerId = await seedUser()
    const dbEvent = await seedLadvEvent({ createdBy: ownerId })

    const ladv = makeLadvData({}, { abgesagt: true })
    const result = await applyLadvSync(dbEvent, ladv, { db })

    expect(result.cancelled).toBe(true)
    const after = await loadEvent(dbEvent.id)
    expect(after?.cancelledAt).toBeInstanceOf(Date)
  })

  it('lässt cancelledAt unverändert, wenn bereits gesetzt', async () => {
    const ownerId = await seedUser()
    const earlier = new Date('2099-05-10T12:00:00Z')
    const dbEvent = await seedLadvEvent({ createdBy: ownerId, cancelledAt: earlier })

    const ladv = makeLadvData({}, { abgesagt: true })
    const result = await applyLadvSync(dbEvent, ladv, { db })

    expect(result.cancelled).toBe(false)
    const after = await loadEvent(dbEvent.id)
    expect(after?.cancelledAt?.getTime()).toBe(earlier.getTime())
  })
})

describe('applyLadvSync — Notifications', () => {
  it('Core-Field-Change (date) → event_changed-Notification', async () => {
    const ownerId = await seedUser()
    const dbEvent = await seedLadvEvent({
      createdBy: ownerId,
      date: '2099-06-03',
      ladvData: makeRaw(),
    })
    await seedRegisteredAttendee(dbEvent.id)

    const ladv = makeLadvData(
      { date: '2099-07-01' },
      { datum: new Date('2099-07-01T18:00:00+02:00').getTime() },
    )
    await applyLadvSync(dbEvent, ladv, { db })

    const after = await loadEvent(dbEvent.id)
    expect(after?.date).toBe('2099-07-01')

    const jobs = await loadNotificationJobs(testDb)
    expect(jobs).toHaveLength(1)
    expect(jobs[0].type).toBe('event_changed')
  })

  it('LADV abgesagt = true → event_canceled-Notification an angemeldete Mitglieder', async () => {
    const ownerId = await seedUser()
    const dbEvent = await seedLadvEvent({ createdBy: ownerId })
    const attendeeId = await seedRegisteredAttendee(dbEvent.id)

    const ladv = makeLadvData({}, { abgesagt: true })
    await applyLadvSync(dbEvent, ladv, { db })

    const jobs = await loadNotificationJobs(testDb)
    expect(jobs).toHaveLength(1)
    expect(jobs[0].type).toBe('event_canceled')
    expect(jobs[0].actorUserId).toBeNull()
    expect(jobs[0].payload._recipients.map(r => r.userId)).toContain(attendeeId)
  })

  it('LADV abgesagt = true bei bereits gecanceltem Event → keine erneute Notification', async () => {
    const ownerId = await seedUser()
    const earlier = new Date('2099-05-10T12:00:00Z')
    const dbEvent = await seedLadvEvent({ createdBy: ownerId, cancelledAt: earlier })
    await seedRegisteredAttendee(dbEvent.id)

    const ladv = makeLadvData({}, { abgesagt: true })
    await applyLadvSync(dbEvent, ladv, { db })

    const jobs = await loadNotificationJobs(testDb)
    expect(jobs).toHaveLength(0)
  })

  it('LADV gleichzeitig abgesagt + Datum-Change → nur event_canceled, kein event_changed', async () => {
    const ownerId = await seedUser()
    const dbEvent = await seedLadvEvent({
      createdBy: ownerId,
      date: '2099-06-03',
      ladvData: makeRaw(),
    })
    await seedRegisteredAttendee(dbEvent.id)

    const ladv = makeLadvData(
      { date: '2099-07-01' },
      { datum: new Date('2099-07-01T18:00:00+02:00').getTime(), abgesagt: true },
    )
    await applyLadvSync(dbEvent, ladv, { db })

    const jobs = await loadNotificationJobs(testDb)
    expect(jobs).toHaveLength(1)
    expect(jobs[0].type).toBe('event_canceled')
  })

  it('Reine ladvData-Aktualisierung ohne Core-Change → keine Notification', async () => {
    const ownerId = await seedUser()
    const baseRaw = makeRaw({ beschreibung: 'alt' })
    const dbEvent = await seedLadvEvent({ createdBy: ownerId, ladvData: baseRaw })
    await seedRegisteredAttendee(dbEvent.id)

    const ladv = makeLadvData({}, { beschreibung: 'neu — nur Beschreibung' })
    await applyLadvSync(dbEvent, ladv, { db })

    const after = await loadEvent(dbEvent.id)
    expect((after?.ladvData as LadvAusschreibung).beschreibung).toBe('neu — nur Beschreibung')
    expect(after?.ladvLastSync).toBeInstanceOf(Date)

    const jobs = await loadNotificationJobs(testDb)
    expect(jobs).toHaveLength(0)
  })
})

describe('applyLadvSync — ladvData & ladvLastSync', () => {
  it('schreibt ladvData (raw) und ladvLastSync immer mit', async () => {
    const ownerId = await seedUser()
    const dbEvent = await seedLadvEvent({ createdBy: ownerId })
    const oldSync = dbEvent.ladvLastSync!.getTime()

    await applyLadvSync(dbEvent, makeLadvData({}, { beschreibung: 'frische LADV-Daten' }), { db })

    const after = await loadEvent(dbEvent.id)
    expect((after?.ladvData as LadvAusschreibung).beschreibung).toBe('frische LADV-Daten')
    expect(after?.ladvLastSync!.getTime()).toBeGreaterThan(oldSync)
  })
})
