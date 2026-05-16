import type { EventType } from '~~/shared/utils/registration'
import type { EventActor } from './actor'
import { EventError } from './errors'
import { decideCreateNotifications } from './notifications'
import { dispatchEventNotifications } from './notifier'
import { insertEvent, type AppDb, type EventInsert } from './persistence'
import { canSetPriority } from './rules'

export type CreateManualEventInput = {
  type: EventType
  name: string
  date: string
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

export type CreateManualEventDeps = {
  db: AppDb
}

export type CreateManualEventResult = {
  id: number
}

export async function createManualEvent(
  input: CreateManualEventInput,
  actor: EventActor,
  deps: CreateManualEventDeps,
): Promise<CreateManualEventResult> {
  const { db } = deps

  if (input.priority != null && !canSetPriority(actor, input.type)) {
    throw new EventError('priority_not_allowed')
  }

  const values: EventInsert = {
    type: input.type,
    name: input.name,
    date: input.date,
    startTime: input.startTime ?? null,
    duration: input.duration ?? null,
    location: input.location ?? null,
    description: input.description ?? null,
    registrationDeadline: input.registrationDeadline ?? null,
    announcementLink: input.announcementLink ?? null,
    raceType: input.raceType ?? null,
    championshipType: input.championshipType ?? null,
    priority: input.priority ?? null,
    createdBy: actor.userId,
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
