import type { EventType } from '~~/shared/utils/registration'
import { eventTypeCapabilities } from '~~/shared/utils/event-types/capabilities'
import type { EventActor } from './actor'
import type { EventRow } from './persistence'

export function canSetPriority(actor: EventActor, eventType: EventType): boolean {
  if (actor.kind !== 'admin') return false
  return eventTypeCapabilities[eventType].hasCompetitionMetadata
}

export function canModifyEvent(actor: EventActor, dbEvent: EventRow): boolean {
  if (actor.kind === 'admin') return true
  return dbEvent.createdBy === actor.userId
}

export function canDeleteEvent(actor: EventActor): boolean {
  return actor.kind === 'admin' && actor.isSuperuser
}
