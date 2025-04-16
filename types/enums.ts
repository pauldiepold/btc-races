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
export const REGISTRATION_TYPES = ['PUBLIC', 'LADV'] as const

// Optionen für Dropdowns
export const championshipTypeOptions = [
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

export const raceTypeOptions = [
  { label: 'Bahn', value: 'TRACK' as RaceType },
  { label: 'Straße', value: 'ROAD' as RaceType },
]

export const registrationTypeOptions = [
  { label: 'Öffentlich', value: 'PUBLIC' as RegistrationType },
  { label: 'LADV', value: 'LADV' as RegistrationType },
]
