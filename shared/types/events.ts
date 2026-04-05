import type { Event } from './db'
import type { LadvAusschreibung } from './ladv'

export type EventListItem = Omit<Event, 'ladvData'> & {
  participantCount: number
  ownRegistrationStatus: 'registered' | 'canceled' | 'maybe' | 'yes' | 'no' | null
  ownRegistrationId: string | null
}

export type DisciplineDetail = {
  id: string
  discipline: string
  ageClass: string
  ladvRegisteredAt: Date | null
  ladvRegisteredBy: string | null
  ladvCanceledAt: Date | null
  ladvCanceledBy: string | null
}

export type RegistrationDetail = {
  id: string
  userId: string
  firstName: string | null
  lastName: string | null
  status: 'registered' | 'canceled' | 'maybe' | 'yes' | 'no'
  notes: string | null
  createdAt: Date
  disciplines: DisciplineDetail[]
}

export type EventDetail = Omit<Event, 'ladvData'> & {
  ladvData: LadvAusschreibung | null
  registrations: RegistrationDetail[]
}
