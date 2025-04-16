import type { Database } from './database.types'

// Enums aus der Datenbank
export type ChampionshipType = Database['public']['Enums']['championship_type']
export type RaceType = Database['public']['Enums']['race_type']
export type RegistrationType = Database['public']['Enums']['registration_type']

// Enum Werte
export const CHAMPIONSHIP_TYPES = [
  'NO_CHAMPIONSHIP',
  'BBM',
  'NDM',
  'DM',
] as const
export const RACE_TYPES = ['TRACK', 'ROAD'] as const
export const REGISTRATION_TYPES = ['INDEPENDENT', 'LADV', 'CLUB'] as const

// Optionen für Dropdowns
export const championshipTypeItems = [
  {
    label: 'keine Meisterschaft',
    value: 'NO_CHAMPIONSHIP' as ChampionshipType,
  },
  {
    label: 'Berlin-Brandenburgische Meisterschaft',
    value: 'BBM' as ChampionshipType,
  },
  { label: 'Norddeutsche Meisterschaft', value: 'NDM' as ChampionshipType },
  { label: 'Deutsche Meisterschaft', value: 'DM' as ChampionshipType },
]

export const raceTypeItems = [
  { label: 'Bahn', value: 'TRACK' as RaceType },
  { label: 'Straße', value: 'ROAD' as RaceType },
]

export const registrationTypeItems = [
  {
    label: 'Eigenständige Anmeldung',
    value: 'INDEPENDENT' as RegistrationType,
  },
  {
    label: 'LADV-Meldung durch die Coaches',
    value: 'LADV' as RegistrationType,
  },
  { label: 'Anmeldung durch den Verein', value: 'CLUB' as RegistrationType },
]

export const raceTypeMap = {
  TRACK: 'Bahn',
  ROAD: 'Straße',
}

export const registrationTypeMapShort = {
  INDEPENDENT: 'Eigenständig',
  LADV: 'LADV',
  CLUB: 'Verein',
}

export const registrationTypeMapLong = {
  INDEPENDENT: 'Eigenständige Anmeldung',
  LADV: 'LADV-Meldung durch die Coaches',
  CLUB: 'Anmeldung durch den Verein',
}

export const championshipTypeMap = {
  NO_CHAMPIONSHIP: 'keine Meisterschaft',
  BBM: 'Berlin-Brandenburgische Meisterschaft',
  NDM: 'Norddeutsche Meisterschaft',
  DM: 'Deutsche Meisterschaft',
}
