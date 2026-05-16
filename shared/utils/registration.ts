import { eventTypeCapabilities } from './event-types/capabilities'

export type EventType = 'ladv' | 'ladv_external' | 'competition' | 'training' | 'social'
export type EventCategory = 'competition' | 'training' | 'social'
export type RegistrationStatus = 'registered' | 'canceled' | 'maybe' | 'yes' | 'no'

/** Runtime-Liste aller Event-Typen — abgeleitet aus eventTypeCapabilities, damit z.enum & Co. nicht manuell synchronisiert werden müssen. */
export const EVENT_TYPES = Object.keys(eventTypeCapabilities) as [EventType, ...EventType[]]

/** Geordnete Liste der Event-Kategorien — dient z.enum-Validierung und der UI-Filter-Reihenfolge. */
export const EVENT_CATEGORIES = ['competition', 'training', 'social'] as const satisfies readonly EventCategory[]

/** Event-Typen, die manuell angelegt werden (kein LADV-Sync) — für Create-Form & POST-Validierung. */
export const MANUAL_EVENT_TYPES = (Object.keys(eventTypeCapabilities) as EventType[])
  .filter(t => eventTypeCapabilities[t].source === 'manual') as [EventType, ...EventType[]]

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
