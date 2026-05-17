import { mergeLadvSync } from './merge-ladv-sync'
import { decideCancelNotifications, decideChangeNotifications } from './notifications'
import { dispatchEventNotifications } from './notifier'
import { updateEvent, type AppDb, type EventInsert, type EventRow } from './persistence'
import { toEventCoreSnapshot } from '~~/shared/utils/diff-event-core-fields'
import type { NormalizedLadvData } from '~~/shared/types/ladv'

export type ApplyLadvSyncDeps = {
  db: AppDb
}

export type ApplyLadvSyncResult = {
  id: number
  ladvDataChanged: boolean
  cancelled: boolean
}

export async function applyLadvSync(
  dbEvent: EventRow,
  ladvData: NormalizedLadvData,
  deps: ApplyLadvSyncDeps,
): Promise<ApplyLadvSyncResult> {
  const { db } = deps
  const now = new Date()

  const mergeUpdates = mergeLadvSync(dbEvent, ladvData)

  const updates: Partial<EventInsert> = {
    ...mergeUpdates,
    ladvData: ladvData.ladv_data,
    ladvLastSync: now,
  }

  const cancelled = Boolean(ladvData.ladv_data.abgesagt) && !dbEvent.cancelledAt
  if (cancelled) updates.cancelledAt = now

  await updateEvent(db, dbEvent.id, updates)

  const eventAfter: EventRow = { ...dbEvent, ...updates }

  const decisions = [
    ...decideChangeNotifications(
      toEventCoreSnapshot(dbEvent),
      toEventCoreSnapshot(eventAfter),
    ),
    ...(cancelled ? decideCancelNotifications() : []),
  ]

  await dispatchEventNotifications(decisions, {
    dbEvent: eventAfter,
    eventBefore: dbEvent,
    db,
  })

  const ladvDataChanged
    = JSON.stringify(ladvData.ladv_data) !== JSON.stringify(dbEvent.ladvData)

  return { id: dbEvent.id, ladvDataChanged, cancelled }
}
