import type { EventCategory, EventType, RegistrationStatus } from '../registration'

export type DeadlineAction = 'create' | 'change' | 'cancel' | 'change-wish'

export type EventTypeCapabilities = {
  source: 'manual' | 'ladv'
  /** Filter-Kategorie — fasst mehrere Event-Typen zur UI-Filterung zusammen (z. B. ladv + competition → competition). */
  category: EventCategory
  isPubliclyVisible: boolean
  hasCompetitionMetadata: boolean
  hasWishDisciplines: boolean
  hasLadvStandManagement: boolean
  status: {
    initial: RegistrationStatus
    validNext: Partial<Record<RegistrationStatus, RegistrationStatus[]>>
  }
  showsRegistrationDeadline: boolean
  enforcesDeadline: boolean
  /** Teilnehmer melden sich eigenständig beim externen Veranstalter an (z. B. Race-Director). */
  requiresExternalRegistration: boolean
  /** Grammatikalisches Geschlecht des Labels für korrekte Artikel ("einen neuen" vs "ein neues"). */
  grammaticalGender: 'm' | 'n'
  label: string
  newLabel: string
}

export const eventTypeCapabilities: Record<EventType, EventTypeCapabilities> = {
  ladv: {
    source: 'ladv',
    category: 'competition',
    isPubliclyVisible: true,
    hasCompetitionMetadata: true,
    hasWishDisciplines: true,
    hasLadvStandManagement: true,
    status: {
      initial: 'registered',
      validNext: {
        registered: ['canceled'],
        canceled: ['registered'],
      },
    },
    showsRegistrationDeadline: true,
    enforcesDeadline: true,
    requiresExternalRegistration: false,
    grammaticalGender: 'm',
    label: 'Wettkampf',
    newLabel: 'Neuer Wettkampf',
  },
  ladv_external: {
    source: 'ladv',
    category: 'competition',
    isPubliclyVisible: true,
    hasCompetitionMetadata: true,
    hasWishDisciplines: false,
    hasLadvStandManagement: false,
    status: {
      initial: 'registered',
      validNext: {
        registered: ['maybe', 'no'],
        maybe: ['registered', 'no'],
        no: ['registered', 'maybe'],
      },
    },
    showsRegistrationDeadline: true,
    enforcesDeadline: false,
    requiresExternalRegistration: true,
    grammaticalGender: 'm',
    label: 'Wettkampf',
    newLabel: 'Neuer Wettkampf',
  },
  competition: {
    source: 'manual',
    category: 'competition',
    isPubliclyVisible: true,
    hasCompetitionMetadata: true,
    hasWishDisciplines: false,
    hasLadvStandManagement: false,
    status: {
      initial: 'registered',
      validNext: {
        registered: ['maybe', 'no'],
        maybe: ['registered', 'no'],
        no: ['registered', 'maybe'],
      },
    },
    showsRegistrationDeadline: true,
    enforcesDeadline: false,
    requiresExternalRegistration: true,
    grammaticalGender: 'm',
    label: 'Wettkampf',
    newLabel: 'Neuer Wettkampf',
  },
  training: {
    source: 'manual',
    category: 'training',
    isPubliclyVisible: false,
    hasCompetitionMetadata: false,
    hasWishDisciplines: false,
    hasLadvStandManagement: false,
    status: {
      initial: 'yes',
      validNext: {
        yes: ['maybe', 'no'],
        maybe: ['yes', 'no'],
        no: ['yes', 'maybe'],
      },
    },
    showsRegistrationDeadline: false,
    enforcesDeadline: false,
    requiresExternalRegistration: false,
    grammaticalGender: 'n',
    label: 'Training',
    newLabel: 'Neues Training',
  },
  social: {
    source: 'manual',
    category: 'social',
    isPubliclyVisible: false,
    hasCompetitionMetadata: false,
    hasWishDisciplines: false,
    hasLadvStandManagement: false,
    status: {
      initial: 'yes',
      validNext: {
        yes: ['maybe', 'no'],
        maybe: ['yes', 'no'],
        no: ['yes', 'maybe'],
      },
    },
    showsRegistrationDeadline: false,
    enforcesDeadline: false,
    requiresExternalRegistration: false,
    grammaticalGender: 'n',
    label: 'Event',
    newLabel: 'Neues Event',
  },
}

/** Capability-Keys mit boolean-Wert — die einzigen, die als Flag-Filter taugen. */
type BooleanCapabilityKey = {
  [K in keyof EventTypeCapabilities]: EventTypeCapabilities[K] extends boolean ? K : never
}[keyof EventTypeCapabilities]

/** Alle Event-Typen, deren boolean-Capability `cap` gesetzt ist. */
export function getEventTypesWith(cap: BooleanCapabilityKey): EventType[] {
  return (Object.keys(eventTypeCapabilities) as EventType[])
    .filter(t => eventTypeCapabilities[t][cap])
}

/** Alle Event-Typen, die zur Filter-Kategorie `category` gehören. */
export function getEventTypesByCategory(category: EventCategory): EventType[] {
  return (Object.keys(eventTypeCapabilities) as EventType[])
    .filter(t => eventTypeCapabilities[t].category === category)
}

export function getPublicEventTypes(): EventType[] {
  return getEventTypesWith('isPubliclyVisible')
}

/**
 * Gültige Status-Optionen bei der Erstanmeldung.
 * hasLadvStandManagement → nur [initial]: Commitment-Anmeldung, Coach meldet bei LADV.
 * Sonst → [initial, 'maybe', 'no']: reine Tracking-Teilnahme.
 */
export function getValidInitialStatuses(eventType: EventType): RegistrationStatus[] {
  const caps = eventTypeCapabilities[eventType]
  if (caps.hasLadvStandManagement) return [caps.status.initial]
  return [caps.status.initial, 'maybe', 'no']
}
