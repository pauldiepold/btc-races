export type EventType = 'ladv' | 'competition' | 'training' | 'social'
export type RegistrationStatus = 'registered' | 'canceled' | 'maybe' | 'yes' | 'no'

export function getEventTypeLabel(type: EventType): string {
  if (type === 'training') return 'Training'
  if (type === 'social') return 'Event'
  return 'Wettkampf'
}

export function getNewEventLabel(type: EventType): string {
  if (type === 'training') return 'Neues Training'
  if (type === 'social') return 'Neues Event'
  return 'Neuer Wettkampf'
}

// Status-Lifecycle-Tabellen leben in server/registration/state.ts (SSOT).
// Re-Exports für Frontend-Konsumenten — die Funktionen sind pure (keine DB / kein HTTP).
export { getValidNextStatuses, getInitialStatus } from '~~/server/registration/state'
