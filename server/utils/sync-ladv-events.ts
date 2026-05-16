import { and, gte, isNotNull } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { applyLadvSync } from '../events/apply-ladv-sync'
import { LadvService } from '../external-apis/ladv/ladv.service'

export type SyncLadvEventsResult = {
  result: string
  stats: {
    synced: number
    updated: number
    cancelled: number
    errors: number
    duration: string
  }
}

export async function runSyncLadvEvents(): Promise<SyncLadvEventsResult> {
  console.log('🔄 Starting LADV events sync...')
  const startTime = Date.now()

  const today = new Date().toISOString().slice(0, 10)
  const events = await db.query.events.findMany({
    where: and(
      isNotNull(schema.events.ladvId),
      gte(schema.events.date, today),
    ),
  })
  console.log(`📥 Found ${events.length} upcoming LADV events to sync`)

  const service = new LadvService()
  let synced = 0
  let updated = 0
  let cancelled = 0
  let errors = 0

  for (const dbEvent of events) {
    try {
      const normalized = await service.fetchAusschreibung(dbEvent.ladvId!)
      const result = await applyLadvSync(dbEvent, normalized, { db })
      if (result.ladvDataChanged) updated++
      if (result.cancelled) cancelled++
      synced++
    }
    catch (err) {
      console.error(`⚠️  LADV sync failed for event ${dbEvent.id} (ladvId: ${dbEvent.ladvId}):`, err)
      errors++
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2)
  console.log(`✅ LADV sync completed in ${duration}s — synced: ${synced}, updated: ${updated}, cancelled: ${cancelled}, errors: ${errors}`)

  return {
    result: 'LADV-Events-Sync abgeschlossen',
    stats: { synced, updated, cancelled, errors, duration: `${duration}s` },
  }
}
