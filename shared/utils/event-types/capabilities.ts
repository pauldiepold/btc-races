import type { EventType, RegistrationStatus } from '../registration'

export type DeadlineAction = 'create' | 'change' | 'cancel' | 'change-wish'

export type EventTypeCapabilities = {
  source: 'manual' | 'ladv'
  isPubliclyVisible: boolean
  hasCompetitionMetadata: boolean
  hasWishDisciplines: boolean
  hasLadvStandManagement: boolean
  status: {
    initial: RegistrationStatus
    validInitial: RegistrationStatus[]
    validNext: Partial<Record<RegistrationStatus, RegistrationStatus[]>>
  }
  showsRegistrationDeadline: boolean
  enforcesDeadline: boolean
  label: string
  newLabel: string
}

export const eventTypeCapabilities: Record<EventType, EventTypeCapabilities> = {
  ladv: {
    source: 'ladv',
    isPubliclyVisible: true,
    hasCompetitionMetadata: true,
    hasWishDisciplines: true,
    hasLadvStandManagement: true,
    status: {
      initial: 'registered',
      validInitial: ['registered'],
      validNext: {
        registered: ['canceled'],
        canceled: ['registered'],
      },
    },
    showsRegistrationDeadline: true,
    enforcesDeadline: true,
    label: 'Wettkampf',
    newLabel: 'Neuer Wettkampf',
  },
  competition: {
    source: 'manual',
    isPubliclyVisible: true,
    hasCompetitionMetadata: true,
    hasWishDisciplines: false,
    hasLadvStandManagement: false,
    status: {
      initial: 'registered',
      validInitial: ['registered', 'maybe'],
      validNext: {
        registered: ['maybe', 'no'],
        maybe: ['registered', 'no'],
        no: ['registered', 'maybe'],
      },
    },
    showsRegistrationDeadline: true,
    enforcesDeadline: true,
    label: 'Wettkampf',
    newLabel: 'Neuer Wettkampf',
  },
  training: {
    source: 'manual',
    isPubliclyVisible: false,
    hasCompetitionMetadata: false,
    hasWishDisciplines: false,
    hasLadvStandManagement: false,
    status: {
      initial: 'yes',
      validInitial: ['yes', 'maybe', 'no'],
      validNext: {
        yes: ['maybe', 'no'],
        maybe: ['yes', 'no'],
        no: ['yes', 'maybe'],
      },
    },
    showsRegistrationDeadline: false,
    enforcesDeadline: false,
    label: 'Training',
    newLabel: 'Neues Training',
  },
  social: {
    source: 'manual',
    isPubliclyVisible: false,
    hasCompetitionMetadata: false,
    hasWishDisciplines: false,
    hasLadvStandManagement: false,
    status: {
      initial: 'yes',
      validInitial: ['yes', 'maybe', 'no'],
      validNext: {
        yes: ['maybe', 'no'],
        maybe: ['yes', 'no'],
        no: ['yes', 'maybe'],
      },
    },
    showsRegistrationDeadline: false,
    enforcesDeadline: false,
    label: 'Event',
    newLabel: 'Neues Event',
  },
}

export function getPublicEventTypes(): EventType[] {
  return (Object.keys(eventTypeCapabilities) as EventType[])
    .filter(t => eventTypeCapabilities[t].isPubliclyVisible)
}
