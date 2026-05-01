import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { faker } from '@faker-js/faker/locale/de'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { LadvService } from '../external-apis/ladv/ladv.service'
import { normalizeLadvData } from './ladv'
import type { LadvAusschreibung, LadvWettbewerb } from '~~/shared/types/ladv'
import { isRunningDiscipline } from '~~/shared/utils/ladv-labels'

// LADV-Ausschreibungs-IDs — jeden 3. auskommentiert
const LADV_IDS: Array<{ id: number, label: string }> = [
  { id: 45487, label: 'Winterlaufserie Wilmersdorf (1)' },
  { id: 45510, label: 'Winterlaufserie Wilmersdorf (2)' },
  // { id: 45699, label: 'oBBM/BBM Potsdam' },
  { id: 45511, label: 'Winterlaufserie Wilmersdorf (3)' },
  { id: 46518, label: 'DM 10km Uelzen' },
  // { id: 45352, label: '37. Lauf der Sympathie Spandau' },
  { id: 45916, label: 'oBBM 10km Spandau' },
  { id: 46970, label: 'BBM Langstrecke Marzahn' },
  // { id: 47172, label: 'BBM Langstaffeln Schöneberg' },
  { id: 46212, label: '17. Berliner Läufermeeting Marzahn' },
  { id: 47463, label: 'Frühjahrssportfest LAC Berlin Marzahn' },
  // { id: 47531, label: 'DM Langstrecke Celle' },
  { id: 46947, label: '1. Abendsportfest BSV 1892 + oBBM 4x400m Wilmersdorf' },
  { id: 46897, label: 'oBBM 5km Straßenlauf Britz' },
  // { id: 46631, label: 'Pfingstsportfest THE BERLIN MEETING Lichterfelde' },
  { id: 46231, label: 'Abendsportfest & BBM 3000m U18/U20 Zehlendorf' },
  { id: 47386, label: 'oBBM Männer/Frauen/U20/U18/U16 Hohenschönhausen' },
  // { id: 47642, label: '32. midsommar EAP Meeting Charlottenburg' },
  { id: 47164, label: '2. Abendsportfest BSV 1892 Wilmersdorf' },
]

const FIXTURE_DIR = resolve(process.cwd(), 'server/db/seed/ladv-fixtures')

function loadFixture(id: number): LadvAusschreibung | null {
  try {
    const path = resolve(FIXTURE_DIR, `${id}.json`)
    if (!existsSync(path)) return null
    return JSON.parse(readFileSync(path, 'utf-8')) as LadvAusschreibung
  }
  catch {
    return null
  }
}

function saveFixture(id: number, data: LadvAusschreibung): void {
  const path = resolve(FIXTURE_DIR, `${id}.json`)
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8')
}

function deriveChampionshipType(name: string): 'bbm' | 'ndm' | 'dm' | null {
  if (name.includes('BBM')) return 'bbm'
  if (name.includes('NDM')) return 'ndm'
  if (name.includes('DM')) return 'dm'
  return null
}

const berlinDateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' })

function toDateString(d: Date): string {
  return berlinDateFormatter.format(d)
}

function randomPastDate(daysAgo: { min: number, max: number }): string {
  return toDateString(faker.date.recent({ days: faker.number.int(daysAgo) }))
}

function randomFutureDate(daysAhead: { min: number, max: number }): string {
  return toDateString(faker.date.soon({ days: faker.number.int(daysAhead) }))
}

export async function runSeed(): Promise<{ result: string }> {
  console.log('🌱 Starting seed...')

  // ─── Schritt 1: DB leeren ─────────────────────────────────────────────────
  console.log('🗑️  Clearing database...')
  await db.delete(schema.registrations)
  await db.delete(schema.notificationDeliveries)
  await db.delete(schema.notificationJobs)
  await db.delete(schema.notificationPreferences)
  await db.delete(schema.pushSubscriptions)
  await db.delete(schema.authTokens)
  await db.delete(schema.events)
  await db.delete(schema.users)
  console.log('   Done.')

  // ─── Schritt 2: Campai-Sync ───────────────────────────────────────────────
  console.log('🔄 Syncing members from Campai...')
  await runSyncMembers()

  // ─── Schritt 3: User-Check & Test-User ───────────────────────────────────
  const allUsers = await db.query.users.findMany({ columns: { id: true } })
  if (allUsers.length < 50) {
    throw new Error(
      `❌ Campai-Sync hat nur ${allUsers.length} User geliefert (min. 50 erwartet). Seed abgebrochen.`,
    )
  }
  console.log(`✅ ${allUsers.length} Campai-User vorhanden.`)

  console.log('👤 Upserting test users...')
  const testUsers = [
    {
      email: 'paul@diepold.de',
      firstName: 'Paul',
      lastName: 'Diepold',
      role: 'superuser' as const,
      membershipStatus: 'active' as const,
      hasLadvStartpass: 1,
    },
    {
      email: 'testadmin@btc-berlin.de',
      firstName: 'Test',
      lastName: 'Admin',
      role: 'admin' as const,
      membershipStatus: 'active' as const,
      hasLadvStartpass: 1,
    },
    {
      email: 'testmember1@btc-berlin.de',
      firstName: 'Kevin',
      lastName: 'Testmitglied',
      role: 'member' as const,
      membershipStatus: 'active' as const,
      hasLadvStartpass: 1, // hat Startpass → LADV-Anmeldung möglich
    },
    {
      email: 'testmember2@btc-berlin.de',
      firstName: 'Lisa',
      lastName: 'Testmitglied',
      role: 'member' as const,
      membershipStatus: 'active' as const,
      hasLadvStartpass: 0, // kein Startpass → F-22-Flow testbar
    },
  ]

  const testUserIds: Record<string, number> = {}
  for (const u of testUsers) {
    const existing = await db.query.users.findFirst({
      where: eq(schema.users.email, u.email),
      columns: { id: true },
    })
    if (existing) {
      await db.update(schema.users).set(u).where(eq(schema.users.email, u.email))
      testUserIds[u.email] = existing.id
    }
    else {
      const inserted = await db.insert(schema.users).values(u).returning({ id: schema.users.id })
      testUserIds[u.email] = inserted[0]!.id
    }
  }

  const allUsersAfter = await db.query.users.findMany({
    where: eq(schema.users.membershipStatus, 'active'),
    columns: { id: true },
  })
  const testUserIdSet = new Set(Object.values(testUserIds))
  const campaiUserIds = allUsersAfter
    .map(u => u.id)
    .filter(id => !testUserIdSet.has(id))

  console.log(`   Test-User OK. ${campaiUserIds.length} Campai-User als Anmeldungs-Pool.`)

  // ─── Schritt 4: LADV-Events ───────────────────────────────────────────────
  console.log('🏟️  Seeding LADV events...')
  let ladvService: LadvService | null = null
  try {
    ladvService = new LadvService()
  }
  catch {
    console.warn('   ⚠️  LADV API Key fehlt — nur Fixtures werden geladen.')
  }

  const ladvEventIds: number[] = []
  let firstLadvEventId: number | null = null

  for (const { id, label } of LADV_IDS) {
    let normalized = null

    // Fixture als Primary — API als Fallback
    const fixture = loadFixture(id)
    if (fixture) {
      console.log(`   📦 ${label} (${id}) — aus Fixture`)
      normalized = normalizeLadvData(fixture)
    }
    else if (ladvService) {
      try {
        console.log(`   🌐 ${label} (${id}) — von LADV-API...`)
        normalized = await ladvService.fetchAusschreibung(id)
        try {
          saveFixture(id, normalized.ladv_data)
          console.log(`      → gespeichert als Fixture`)
        }
        catch {
          console.warn(`      → Fixture konnte nicht gespeichert werden (kein Filesystem verfügbar)`)
        }
      }
      catch (e) {
        console.warn(`   ⚠️  Fehler bei ${label} (${id}): ${(e as Error).message} — übersprungen`)
        continue
      }
    }
    else {
      console.warn(`   ⚠️  Kein Fixture und kein API Key für ${label} (${id}) — übersprungen`)
      continue
    }

    const createdBy = faker.helpers.arrayElement([...Object.values(testUserIds)])
    const insertedEvent = await db.insert(schema.events).values({
      type: 'ladv',
      name: normalized.name,
      date: normalized.date ?? null,
      startTime: normalized.start_time,
      location: normalized.location,
      registrationDeadline: normalized.registration_deadline ?? null,
      raceType: normalized.race_type,
      isWrc: normalized.is_wrc,
      championshipType: deriveChampionshipType(normalized.name),
      ladvId: id,
      ladvData: normalized.ladv_data,
      ladvLastSync: new Date(),
      createdBy,
    }).returning({ id: schema.events.id })
    const eventId = insertedEvent[0]!.id
    ladvEventIds.push(eventId)
    if (!firstLadvEventId) firstLadvEventId = eventId
  }
  console.log(`   ${ladvEventIds.length} LADV-Events angelegt.`)

  // ─── Schritt 5: Generierte Events ────────────────────────────────────────
  console.log('🎲 Generating fake events...')
  const allCreatedByPool = [...Object.values(testUserIds)]

  // 8 competition-Events
  const competitionEventIds: number[] = []
  const competitionConfigs = [
    { deadlineOffset: -10, dateOffset: 30, startTime: '10:00' as string | null, duration: 120 }, // Meldefrist abgelaufen
    { deadlineOffset: -10, dateOffset: 30, startTime: '14:30' as string | null, duration: 90 }, // Meldefrist abgelaufen
    { deadlineOffset: 5, dateOffset: 20, startTime: '09:00' as string | null, duration: 180 }, // Meldefrist offen
    { deadlineOffset: 5, dateOffset: 20, startTime: null, duration: null }, // Meldefrist offen, keine Zeit
    { deadlineOffset: 60, dateOffset: 90, startTime: '11:00' as string | null, duration: 60 }, // Meldefrist weit in Zukunft
    { deadlineOffset: 60, dateOffset: 90, startTime: null, duration: null }, // Meldefrist weit in Zukunft
    { deadlineOffset: -20, dateOffset: -5, startTime: '10:00' as string | null, duration: 120 }, // vergangen
    { deadlineOffset: -30, dateOffset: -15, startTime: null, duration: null }, // vergangen
  ]
  for (const cfg of competitionConfigs) {
    const eventDate = toDateString(new Date(Date.now() + cfg.dateOffset * 24 * 60 * 60 * 1000))
    const deadline = toDateString(new Date(Date.now() + cfg.deadlineOffset * 24 * 60 * 60 * 1000))
    const inserted = await db.insert(schema.events).values({
      type: 'competition',
      name: `${faker.location.city()} ${faker.number.int({ min: 1, max: 40 })}. Stadtlauf`,
      date: eventDate,
      startTime: cfg.startTime,
      duration: cfg.duration,
      location: faker.location.city(),
      registrationDeadline: deadline,
      raceType: faker.helpers.arrayElement(['track', 'road'] as const),
      championshipType: faker.helpers.arrayElement(['none', 'bbm', 'ndm', 'dm'] as const),
      createdBy: faker.helpers.arrayElement(allCreatedByPool),
    }).returning({ id: schema.events.id })
    competitionEventIds.push(inserted[0]!.id)
  }

  // 10 training-Events
  const trainingEventIds: number[] = []
  const trainingNames = [
    'Intervalltraining Tempelhof', 'Langer Dauerlauf', 'Tempotraining Bahn',
    'Hügelläufe Grunewald', 'Regenerationslauf', 'Fahrtspiel Tiergarten',
    'Kraftausdauer', 'Bergläufe Teufelsberg', 'Schwellentraining', '5km-Test',
  ]
  for (let i = 0; i < 10; i++) {
    const isPast = i < 4
    const eventDate = isPast
      ? randomPastDate({ min: 10, max: 60 })
      : randomFutureDate({ min: 3, max: 45 })
    const inserted = await db.insert(schema.events).values({
      type: 'training',
      name: trainingNames[i]!,
      date: eventDate,
      location: faker.helpers.arrayElement(['Olympiastadion', 'Mommsenstadion', 'Werner-Seelenbinder-Sportpark', 'Trabrennbahn Karlshorst']),
      createdBy: faker.helpers.arrayElement(allCreatedByPool),
    }).returning({ id: schema.events.id })
    trainingEventIds.push(inserted[0]!.id)
  }

  // 9 social-Events
  const socialEventIds: number[] = []
  const socialNames = [
    'BTC-Sommerfest', 'Weihnachtsfeier', 'Saisonabschluss', 'Vereinsausflug Rügen',
    'Pasta-Party vor dem Marathon', 'Jahreshauptversammlung', 'Team-Brunch',
    'Ehrungsabend', 'Neujahrslauf',
  ]
  for (let i = 0; i < 9; i++) {
    const isPast = i < 3
    const eventDate = i === 5
      ? null // ein Event ohne Datum (tbd)
      : isPast
        ? randomPastDate({ min: 10, max: 90 })
        : randomFutureDate({ min: 5, max: 120 })
    const inserted = await db.insert(schema.events).values({
      type: 'social',
      name: socialNames[i]!,
      date: eventDate,
      location: faker.helpers.arrayElement(['BTC-Clubhaus', 'Vereinsheim Tempelhof', 'Gaststätte Olympia', null]),
      createdBy: faker.helpers.arrayElement(allCreatedByPool),
    }).returning({ id: schema.events.id })
    socialEventIds.push(inserted[0]!.id)
  }

  console.log(`   ${competitionEventIds.length} competition, ${trainingEventIds.length} training, ${socialEventIds.length} social angelegt.`)

  // ─── Schritt 6: Anmeldungen ───────────────────────────────────────────────
  console.log('📋 Seeding registrations...')

  const kevinId = testUserIds['testmember1@btc-berlin.de']!
  const lisaId = testUserIds['testmember2@btc-berlin.de']!
  const adminId = testUserIds['testadmin@btc-berlin.de']!
  const paulId = testUserIds['paul@diepold.de']!

  async function seedRandomRegistrations(
    eventId: number,
    eventType: 'ladv' | 'competition' | 'training' | 'social',
    ladvWettbewerbe: LadvWettbewerb[] = [],
    excludeUserIds: number[] = [],
  ) {
    const pool = [...campaiUserIds, ...Object.values(testUserIds)].filter(
      id => !excludeUserIds.includes(id),
    )
    const count = faker.number.int({ min: 3, max: 15 })
    const selected = faker.helpers.arrayElements(pool, Math.min(count, pool.length))

    for (const userId of selected) {
      const status = eventType === 'ladv' || eventType === 'competition'
        ? faker.helpers.arrayElement(['registered', 'registered', 'registered', 'canceled'] as const)
        : faker.helpers.arrayElement(['yes', 'yes', 'maybe', 'no'] as const)

      const wishDisciplines = (eventType === 'ladv' && ladvWettbewerbe.length > 0)
        ? [faker.helpers.arrayElement(ladvWettbewerbe)].map(d => ({ discipline: d.disziplinNew, ageClass: d.klasseNew }))
        : []

      await db.insert(schema.registrations).values({
        eventId,
        userId,
        status,
        notes: faker.datatype.boolean(0.3) ? faker.lorem.sentence() : null,
        wishDisciplines,
      })
    }
  }

  // LADV-Events: zufällige Anmeldungen + hardcodierte Szenarien
  for (const eventId of ladvEventIds) {
    const event = await db.query.events.findFirst({
      where: eq(schema.events.id, eventId),
    })
    const wettbewerbe = ((event?.ladvData as LadvAusschreibung | null)?.wettbewerbe ?? [])
      .filter(w => isRunningDiscipline(w.disziplinNew))

    await seedRandomRegistrations(eventId, 'ladv', wettbewerbe, [kevinId, lisaId, adminId, paulId])
  }

  // Hardcodierte Szenarien — brauchen ein LADV-Event mit Wettbewerben
  if (firstLadvEventId) {
    const firstEvent = await db.query.events.findFirst({
      where: eq(schema.events.id, firstLadvEventId),
    })
    const wettbewerbe = ((firstEvent?.ladvData as LadvAusschreibung | null)?.wettbewerbe ?? [])
      .filter(w => isRunningDiscipline(w.disziplinNew))
    const disc = wettbewerbe[0] ?? { disziplinNew: 'L5K0', klasseNew: 'M30' }

    const disciplinePair = { discipline: disc.disziplinNew, ageClass: disc.klasseNew }

    // Szenario 1: Kevin — Wunschstand gesetzt, LADV-Stand ebenfalls (Coach hat bereits gemeldet)
    await db.insert(schema.registrations).values({
      eventId: firstLadvEventId,
      userId: kevinId,
      status: 'registered',
      notes: 'Freue mich drauf!',
      wishDisciplines: [disciplinePair],
      ladvDisciplines: [disciplinePair],
    })

    // Szenario 2: Lisa — kein Startpass, kann sich nicht bei LADV-Events anmelden (F-22-Flow)
    // Lisa bekommt KEINE Anmeldung bei LADV-Events — der Fehler soll beim Versuch auftreten

    // Szenario 3: Admin — abgesagt nach LADV-Meldung (E-04-Flow testbar)
    // ladvDisciplines !== null → Coach muss in LADV abmelden
    await db.insert(schema.registrations).values({
      eventId: firstLadvEventId,
      userId: adminId,
      status: 'canceled',
      notes: null,
      wishDisciplines: [disciplinePair],
      ladvDisciplines: [disciplinePair],
    })

    // Szenario 4: Paul — angemeldet, Disziplin gewählt, aber noch NICHT bei LADV eingereicht
    // ladvDisciplines: null → Coach hat noch nicht gemeldet → Todo vorhanden
    await db.insert(schema.registrations).values({
      eventId: firstLadvEventId,
      userId: paulId,
      status: 'registered',
      notes: null,
      wishDisciplines: [disciplinePair],
      ladvDisciplines: null,
    })
  }

  // competition-Events mit Anmeldung < 3 Tage vor Meldefrist (E-05-Trigger testbar)
  // competitionConfigs[2] hat deadlineOffset = +5 → Frist in 5 Tagen
  const nearDeadlineEventId = competitionEventIds[2]
  if (nearDeadlineEventId) {
    await db.insert(schema.registrations).values({
      eventId: nearDeadlineEventId,
      userId: paulId,
      status: 'registered',
    })
    await seedRandomRegistrations(nearDeadlineEventId, 'competition', [], [paulId])
  }

  // Training- und Social-Events: zufällige Anmeldungen
  for (const eventId of trainingEventIds) {
    await seedRandomRegistrations(eventId, 'training')
  }
  for (const eventId of socialEventIds) {
    await seedRandomRegistrations(eventId, 'social')
  }

  // competition-Events (restliche): zufällige Anmeldungen
  for (const eventId of competitionEventIds.filter(id => id !== nearDeadlineEventId)) {
    await seedRandomRegistrations(eventId, 'competition')
  }

  console.log('✅ Seed abgeschlossen.')
  return { result: 'Seed erfolgreich' }
}
