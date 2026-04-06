export type EventType = 'ladv' | 'competition' | 'training' | 'social'
export type RegistrationStatus = 'registered' | 'canceled' | 'maybe' | 'yes' | 'no'

// State Machine gemäß Feature-Spec:
// ladv:        registered ↔ canceled
// competition: registered ↔ maybe ↔ canceled
// training:    yes ↔ maybe ↔ no
// social:      yes ↔ maybe ↔ no
//
// Fristprüfung ist NICHT Teil dieser Funktion — die macht isDeadlineExpired.
// Diese Funktion gibt nur die laut State Machine erlaubten Übergänge zurück.
export function getValidNextStatuses(
  current: RegistrationStatus,
  eventType: EventType,
): RegistrationStatus[] {
  if (eventType === 'ladv') {
    if (current === 'registered') return ['canceled']
    if (current === 'canceled') return ['registered']
    return []
  }

  if (eventType === 'competition') {
    if (current === 'registered') return ['maybe', 'canceled']
    if (current === 'maybe') return ['registered', 'canceled']
    if (current === 'canceled') return ['registered', 'maybe']
    return []
  }

  // training + social
  if (current === 'yes') return ['maybe', 'no']
  if (current === 'maybe') return ['yes', 'no']
  if (current === 'no') return ['yes', 'maybe']
  return []
}

// Initialer Status beim Anmelden je nach Event-Typ
export function getInitialStatus(eventType: EventType): RegistrationStatus {
  if (eventType === 'ladv' || eventType === 'competition') return 'registered'
  return 'yes'
}
