import { and, eq, gte, isNotNull } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { LadvService } from '../external-apis/ladv/ladv.service'
import { toEventCoreSnapshot, triggerEventChangedNotification } from '../notifications/triggers'
import { detectLadvDiff } from '~~/shared/utils/ladv'
import type { LadvAusschreibung } from '~~/shared/types/ladv'

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
  const now = new Date()
  let synced = 0
  let updated = 0
  let cancelled = 0
  let errors = 0

  for (const dbEvent of events) {
    let normalized
    try {
      normalized = await service.fetchAusschreibung(dbEvent.ladvId!)
    }
    catch (err) {
      console.error(`⚠️  LADV fetch failed for event ${dbEvent.id} (ladvId: ${dbEvent.ladvId}):`, err)
      errors++
      continue
    }

    const preSyncDiff = detectLadvDiff(dbEvent, dbEvent.ladvData as LadvAusschreibung)
    const beforeCore = toEventCoreSnapshot(dbEvent)

    const updates: Partial<typeof schema.events.$inferInsert> = {
      // Protected fields: nur überschreiben wenn kein manueller Override vorhanden
      ...(preSyncDiff.name === undefined ? { name: normalized.name } : {}),
      ...(preSyncDiff.date === undefined ? { date: normalized.date } : {}),
      ...(preSyncDiff.location === undefined ? { location: normalized.location } : {}),
      ...(preSyncDiff.registrationDeadline === undefined ? { registrationDeadline: normalized.registration_deadline } : {}),
      ...(preSyncDiff.raceType === undefined ? { raceType: normalized.race_type } : {}),
      // Immer aktualisieren
      startTime: normalized.start_time,
      isWrc: normalized.is_wrc,
      ladvData: normalized.ladv_data,
      ladvLastSync: now,
      updatedAt: now,
    }

    if (normalized.ladv_data.abgesagt && !dbEvent.cancelledAt) {
      updates.cancelledAt = now
      cancelled++
    }

    await db.update(schema.events).set(updates).where(eq(schema.events.id, dbEvent.id))

    const ladvDataChanged = JSON.stringify(normalized.ladv_data) !== JSON.stringify(dbEvent.ladvData)
    if (ladvDataChanged) updated++

    const afterCore = toEventCoreSnapshot({
      date: (updates.date ?? dbEvent.date) as string | null,
      startTime: (updates.startTime ?? dbEvent.startTime) as string | null,
      location: (updates.location ?? dbEvent.location) as string | null,
    })

    await triggerEventChangedNotification(
      beforeCore,
      afterCore,
      {
        id: dbEvent.id,
        name: (updates.name ?? dbEvent.name) as string,
        date: (updates.date ?? dbEvent.date) as string | null,
        cancelledAt: (updates.cancelledAt ?? dbEvent.cancelledAt) as Date | null,
      },
    )

    synced++
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2)
  console.log(`✅ LADV sync completed in ${duration}s — synced: ${synced}, updated: ${updated}, cancelled: ${cancelled}, errors: ${errors}`)

  return {
    result: 'LADV-Events-Sync abgeschlossen',
    stats: { synced, updated, cancelled, errors, duration: `${duration}s` },
  }
}
