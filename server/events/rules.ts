import type { EventType } from '~~/shared/utils/registration'
import { eventTypeCapabilities } from '~~/shared/utils/event-types/capabilities'
import type { EventActor } from './actor'

export function canSetPriority(actor: EventActor, eventType: EventType): boolean {
  if (actor.kind !== 'admin') return false
  return eventTypeCapabilities[eventType].hasCompetitionMetadata
}
