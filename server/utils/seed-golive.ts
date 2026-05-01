import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { LadvService } from '../external-apis/ladv/ladv.service'
import { normalizeLadvData } from './ladv'
import type { LadvAusschreibung } from '~~/shared/types/ladv'

const GOLIVE_LADV_IDS: Array<{ id: number, label: string }> = [
  { id: 46897, label: 'oBBM 5km Straßenlauf Berlin-Britz' },
  { id: 46947, label: '1. Abendsportfest BSV 1892 + oBBM 4x400m Wilmersdorf' },
  { id: 46231, label: 'Abendsportfest & BBM 3000m U18/U20 Zehlendorf' },
  { id: 46631, label: 'Pfingstsportfest THE BERLIN MEETING Lichterfelde' },
  { id: 47386, label: 'oBBM Männer/Frauen/U20/U18/U16 Hohenschönhausen' },
  { id: 47642, label: '32. midsommar EAP Meeting Charlottenburg' },
  { id: 47164, label: '2. Abendsportfest BSV 1892 Wilmersdorf' },
  { id: 46479, label: '10. Berliner Nikolauslauf 2026 Berlin-Zehlendorf' },
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

export async function runGolive(): Promise<{ result: string }> {
  console.log('🚀 Starting Go-Live-Seed...')

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

  // ─── Schritt 3: User-Check ────────────────────────────────────────────────
  const allUsers = await db.query.users.findMany({ columns: { id: true } })
  if (allUsers.length < 50) {
    throw new Error(
      `❌ Campai-Sync hat nur ${allUsers.length} User geliefert (min. 50 erwartet). Go-Live-Seed abgebrochen.`,
    )
  }
  console.log(`✅ ${allUsers.length} Campai-User vorhanden.`)

  // ─── Schritt 4: Superuser paul@diepold.de ────────────────────────────────
  console.log('👤 Upserting superuser...')
  const superuserData = {
    email: 'paul@diepold.de',
    firstName: 'Paul',
    lastName: 'Diepold',
    role: 'superuser' as const,
    membershipStatus: 'active' as const,
    hasLadvStartpass: 1,
  }
  let superuserId: number
  const existing = await db.query.users.findFirst({
    where: eq(schema.users.email, superuserData.email),
    columns: { id: true },
  })
  if (existing) {
    await db.update(schema.users).set(superuserData).where(eq(schema.users.email, superuserData.email))
    superuserId = existing.id
  }
  else {
    const inserted = await db.insert(schema.users).values(superuserData).returning({ id: schema.users.id })
    superuserId = inserted[0]!.id
  }
  console.log(`   Superuser ID: ${superuserId}`)

  // ─── Schritt 5: LADV-Events ───────────────────────────────────────────────
  console.log('🏟️  Importing production LADV events...')
  let ladvService: LadvService | null = null
  try {
    ladvService = new LadvService()
  }
  catch {
    console.warn('   ⚠️  LADV API Key fehlt — nur Fixtures werden geladen.')
  }

  let importedCount = 0
  for (const { id, label } of GOLIVE_LADV_IDS) {
    let normalized = null

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
          console.warn(`      → Fixture konnte nicht gespeichert werden`)
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

    await db.insert(schema.events).values({
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
      createdBy: superuserId,
    })
    importedCount++
  }

  console.log(`   ${importedCount} LADV-Events importiert.`)
  console.log('✅ Go-Live-Seed abgeschlossen.')
  return { result: `Go-Live-Seed erfolgreich — ${importedCount} Events importiert` }
}
