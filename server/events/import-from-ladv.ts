import type { NormalizedLadvData } from '~~/shared/types/ladv'
import type { EventActor } from './actor'
import { EventError } from './errors'
import { decideCreateNotifications } from './notifications'
import { dispatchEventNotifications } from './notifier'
import { findByLadvId, insertEvent, type AppDb, type EventInsert } from './persistence'

export type ImportEventFromLadvInput = {
  eventType: 'ladv' | 'ladv_external'
  ladvId: number
  ladvData: NormalizedLadvData
}

export type ImportEventFromLadvDeps = {
  db: AppDb
}

export type ImportEventFromLadvResult = {
  id: number
}

export async function importEventFromLadv(
  input: ImportEventFromLadvInput,
  actor: EventActor,
  deps: ImportEventFromLadvDeps,
): Promise<ImportEventFromLadvResult> {
  const { db } = deps
  const { eventType, ladvId, ladvData } = input

  const existing = await findByLadvId(db, ladvId)
  if (existing) {
    throw new EventError('ladv_id_already_imported', undefined, { existingEventId: existing.id })
  }

  const now = new Date()
  const values: EventInsert = {
    type: eventType,
    name: ladvData.name,
    date: ladvData.date,
    startTime: ladvData.start_time,
    location: ladvData.location,
    registrationDeadline: ladvData.registration_deadline,
    raceType: ladvData.race_type,
    isWrc: ladvData.is_wrc,
    ladvId,
    ladvData: ladvData.ladv_data,
    ladvLastSync: now,
    createdBy: actor.userId,
    createdAt: now,
    updatedAt: now,
  }

  const dbEvent = await insertEvent(db, values)

  const decisions = decideCreateNotifications()

  await dispatchEventNotifications(decisions, {
    dbEvent,
    actorUserId: actor.userId,
    db,
  })

  return { id: dbEvent.id }
}
