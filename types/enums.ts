import type { Database } from './database.types'

// Datenbank-Typen
export type ChampionshipType = Database['public']['Enums']['championship_type']
export type RaceType = Database['public']['Enums']['race_type']
export type RegistrationType = Database['public']['Enums']['registration_type']
export type RegistrationStatus =
  Database['public']['Enums']['registration_status']

/**
 * Meisterschaftstypen
 */
export const ChampionshipTypes = {
  NO_CHAMPIONSHIP: 'NO_CHAMPIONSHIP' as const,
  BBM: 'BBM' as const,
  NDM: 'NDM' as const,
  DM: 'DM' as const,
}

// Typen für Typensicherheit
export type ChampionshipTypeKeys = keyof typeof ChampionshipTypes
export type ChampionshipTypeValues =
  (typeof ChampionshipTypes)[ChampionshipTypeKeys]

/**
 * Wettkampftypen
 */
export const RaceTypes = {
  TRACK: 'TRACK' as const,
  ROAD: 'ROAD' as const,
}

export type RaceTypeKeys = keyof typeof RaceTypes
export type RaceTypeValues = (typeof RaceTypes)[RaceTypeKeys]

/**
 * Anmeldetypen
 */
export const RegistrationTypes = {
  INDEPENDENT: 'INDEPENDENT' as const,
  LADV: 'LADV' as const,
  CLUB: 'CLUB' as const,
}

export type RegistrationTypeKeys = keyof typeof RegistrationTypes
export type RegistrationTypeValues =
  (typeof RegistrationTypes)[RegistrationTypeKeys]

/**
 * E-Mail-Typen
 */
export const EmailTypes = {
  REGISTRATION_CONFIRMATION: 'registration_confirmation' as const,
  REGISTRATION_CANCELLATION: 'registration_cancellation' as const,
  COMPETITION_REMINDER: 'competition_reminder' as const,
}

export type EmailTypeKeys = keyof typeof EmailTypes
export type EmailType = (typeof EmailTypes)[EmailTypeKeys]

/**
 * Registrierungsstatus
 */
export const RegistrationStatuses = {
  PENDING: 'pending' as const,
  CONFIRMED: 'confirmed' as const,
  CANCELED: 'canceled' as const,
  PENDING_CANCELLATION: 'pending_cancellation' as const,
}

export type RegistrationStatusKeys = keyof typeof RegistrationStatuses
export type RegistrationStatusType =
  (typeof RegistrationStatuses)[RegistrationStatusKeys]

// Labels für Benutzeroberfläche
export const ChampionshipTypeLabels: Record<ChampionshipTypeValues, string> = {
  [ChampionshipTypes.NO_CHAMPIONSHIP]: 'keine Meisterschaft',
  [ChampionshipTypes.BBM]: 'Berlin-Brandenburgische Meisterschaft',
  [ChampionshipTypes.NDM]: 'Norddeutsche Meisterschaft',
  [ChampionshipTypes.DM]: 'Deutsche Meisterschaft',
}

export const RaceTypeLabels: Record<RaceTypeValues, string> = {
  [RaceTypes.TRACK]: 'Bahn',
  [RaceTypes.ROAD]: 'Straße',
}

export const RegistrationTypeLabels: Record<RegistrationTypeValues, string> = {
  [RegistrationTypes.INDEPENDENT]: 'Eigenständige Anmeldung',
  [RegistrationTypes.LADV]: 'LADV-Meldung durch die Coaches',
  [RegistrationTypes.CLUB]: 'Anmeldung durch den Verein',
}

export const RegistrationTypeLabelsShort: Record<
  RegistrationTypeValues,
  string
> = {
  [RegistrationTypes.INDEPENDENT]: 'Eigenständig',
  [RegistrationTypes.LADV]: 'LADV',
  [RegistrationTypes.CLUB]: 'Verein',
}

export const EmailTypeLabels: Record<EmailType, string> = {
  [EmailTypes.REGISTRATION_CONFIRMATION]: 'Anmeldebestätigung',
  [EmailTypes.REGISTRATION_CANCELLATION]: 'Abmeldebestätigung',
  [EmailTypes.COMPETITION_REMINDER]: 'Wettkampferinnerung',
}

export const RegistrationStatusLabels: Record<RegistrationStatusType, string> =
  {
    [RegistrationStatuses.PENDING]: 'Anmeldung ausstehend',
    [RegistrationStatuses.CONFIRMED]: 'Anmeldung bestätigt',
    [RegistrationStatuses.CANCELED]: 'Abgemeldet',
    [RegistrationStatuses.PENDING_CANCELLATION]: 'Abmeldung ausstehend',
  }

// Für Abwärtskompatibilität: Die alten Dropdown-Items und Maps bleiben erhalten
export const championshipTypeItems = [
  {
    label: ChampionshipTypeLabels[ChampionshipTypes.NO_CHAMPIONSHIP],
    value: ChampionshipTypes.NO_CHAMPIONSHIP as ChampionshipType,
  },
  {
    label: ChampionshipTypeLabels[ChampionshipTypes.BBM],
    value: ChampionshipTypes.BBM as ChampionshipType,
  },
  {
    label: ChampionshipTypeLabels[ChampionshipTypes.NDM],
    value: ChampionshipTypes.NDM as ChampionshipType,
  },
  {
    label: ChampionshipTypeLabels[ChampionshipTypes.DM],
    value: ChampionshipTypes.DM as ChampionshipType,
  },
]

export const raceTypeItems = [
  {
    label: RaceTypeLabels[RaceTypes.TRACK],
    value: RaceTypes.TRACK as RaceType,
  },
  { label: RaceTypeLabels[RaceTypes.ROAD], value: RaceTypes.ROAD as RaceType },
]

export const registrationTypeItems = [
  {
    label: RegistrationTypeLabels[RegistrationTypes.LADV],
    value: RegistrationTypes.LADV as RegistrationType,
  },
  {
    label: RegistrationTypeLabels[RegistrationTypes.INDEPENDENT],
    value: RegistrationTypes.INDEPENDENT as RegistrationType,
  },
  {
    label: RegistrationTypeLabels[RegistrationTypes.CLUB],
    value: RegistrationTypes.CLUB as RegistrationType,
  },
]

// Zod-kompatible Arrays
export const ZOD_CHAMPIONSHIP_TYPES = [
  ChampionshipTypes.NO_CHAMPIONSHIP,
  ChampionshipTypes.BBM,
  ChampionshipTypes.NDM,
  ChampionshipTypes.DM,
] as const

export const ZOD_RACE_TYPES = [RaceTypes.TRACK, RaceTypes.ROAD] as const

export const ZOD_REGISTRATION_TYPES = [
  RegistrationTypes.INDEPENDENT,
  RegistrationTypes.LADV,
  RegistrationTypes.CLUB,
] as const

export const ZOD_EMAIL_TYPES = [
  EmailTypes.REGISTRATION_CONFIRMATION,
  EmailTypes.REGISTRATION_CANCELLATION,
  EmailTypes.COMPETITION_REMINDER,
] as const

export const ZOD_REGISTRATION_STATUS = [
  RegistrationStatuses.PENDING,
  RegistrationStatuses.CONFIRMED,
  RegistrationStatuses.CANCELED,
  RegistrationStatuses.PENDING_CANCELLATION,
] as const
