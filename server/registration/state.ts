import type { EventType, RegistrationStatus } from '~~/shared/utils/registration'

const VALID_NEXT_STATUSES: Record<EventType, Partial<Record<RegistrationStatus, RegistrationStatus[]>>> = {
  ladv: {
    registered: ['canceled'],
    canceled: ['registered'],
  },
  competition: {
    registered: ['maybe', 'no'],
    maybe: ['registered', 'no'],
    no: ['registered', 'maybe'],
  },
  training: {
    yes: ['maybe', 'no'],
    maybe: ['yes', 'no'],
    no: ['yes', 'maybe'],
  },
  social: {
    yes: ['maybe', 'no'],
    maybe: ['yes', 'no'],
    no: ['yes', 'maybe'],
  },
}

const INITIAL_STATUS: Record<EventType, RegistrationStatus> = {
  ladv: 'registered',
  competition: 'registered',
  training: 'yes',
  social: 'yes',
}

export const VALID_INITIAL: Record<EventType, RegistrationStatus[]> = {
  ladv: ['registered'],
  competition: ['registered', 'maybe'],
  training: ['yes', 'maybe', 'no'],
  social: ['yes', 'maybe', 'no'],
}

export function getValidNextStatuses(
  current: RegistrationStatus,
  eventType: EventType,
): RegistrationStatus[] {
  return VALID_NEXT_STATUSES[eventType]?.[current] ?? []
}

export function getInitialStatus(eventType: EventType): RegistrationStatus {
  return INITIAL_STATUS[eventType]
}
