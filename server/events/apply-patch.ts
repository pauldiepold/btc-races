import type { EventActor } from './actor'
import { EventError } from './errors'
import { decideChangeNotifications } from './notifications'
import { dispatchEventNotifications } from './notifier'
import { loadEventById, updateEvent, type AppDb, type EventInsert, type EventRow } from './persistence'
import { canSetPriority } from './rules'
import { toEventCoreSnapshot } from '~~/shared/utils/diff-event-core-fields'

export type EventPatch = {
  name?: string
  date?: string | null
  startTime?: string | null
  duration?: number | null
  location?: string | null
  description?: string | null
  registrationDeadline?: string | null
  announcementLink?: string | null
  raceType?: 'track' | 'road' | 'trail' | null
  championshipType?: 'none' | 'bbm' | 'ndm' | 'dm' | null
  priority?: 'A' | 'B' | 'C' | null
}

export type ApplyEventPatchDeps = {
  db: AppDb
}

export type ApplyEventPatchOpts = {
  silent?: boolean
}

export type ApplyEventPatchResult = {
  id: number
}

export async function applyEventPatch(
  eventId: number,
  patch: EventPatch,
  actor: EventActor,
  deps: ApplyEventPatchDeps,
  opts: ApplyEventPatchOpts = {},
): Promise<ApplyEventPatchResult> {
  const { db } = deps

  const dbEvent = await loadEventById(db, eventId)
  if (!dbEvent) throw new EventError('event_not_found')

  if (actor.kind === 'owner' && dbEvent.createdBy !== actor.userId) {
    throw new EventError('forbidden')
  }

  const updates: Partial<EventInsert> = { updatedAt: new Date() }

  if (patch.name !== undefined) updates.name = patch.name
  if ('date' in patch) updates.date = patch.date ?? null
  if ('startTime' in patch) updates.startTime = patch.startTime ?? null
  if ('duration' in patch) updates.duration = patch.duration ?? null
  if ('location' in patch) updates.location = patch.location ?? null
  if ('description' in patch) updates.description = patch.description ?? null
  if ('registrationDeadline' in patch) updates.registrationDeadline = patch.registrationDeadline ?? null
  if ('announcementLink' in patch) updates.announcementLink = patch.announcementLink ?? null
  if ('raceType' in patch) updates.raceType = patch.raceType ?? null
  if ('championshipType' in patch) updates.championshipType = patch.championshipType ?? null

  if ('priority' in patch) {
    if (!canSetPriority(actor, dbEvent.type)) {
      throw new EventError('priority_not_allowed')
    }
    updates.priority = patch.priority ?? null
  }

  await updateEvent(db, eventId, updates)

  const eventAfter: EventRow = { ...dbEvent, ...updates }

  const decisions = decideChangeNotifications(
    toEventCoreSnapshot(dbEvent),
    toEventCoreSnapshot(eventAfter),
    { silent: opts.silent },
  )

  await dispatchEventNotifications(decisions, {
    dbEvent: eventAfter,
    eventBefore: dbEvent,
    actorUserId: actor.userId,
    db,
  })

  return { id: eventId }
}
