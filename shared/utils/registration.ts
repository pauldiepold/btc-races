import { eventTypeCapabilities } from './event-types/capabilities'

export type EventType = 'ladv' | 'competition' | 'training' | 'social'
export type RegistrationStatus = 'registered' | 'canceled' | 'maybe' | 'yes' | 'no'

export function getEventTypeLabel(type: EventType): string {
  return eventTypeCapabilities[type].label
}

export function getNewEventLabel(type: EventType): string {
  return eventTypeCapabilities[type].newLabel
}

export function getInitialStatus(eventType: EventType): RegistrationStatus {
  return eventTypeCapabilities[eventType].status.initial
}

export function getValidNextStatuses(
  current: RegistrationStatus,
  eventType: EventType,
): RegistrationStatus[] {
  return eventTypeCapabilities[eventType].status.validNext[current] ?? []
}
