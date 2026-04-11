import type { Event } from './db'
import type { LadvAusschreibung } from './ladv'
import type { EventType, RegistrationStatus } from '../utils/registration'

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
  hasAvatar: boolean
  status: 'registered' | 'canceled' | 'maybe' | 'yes' | 'no'
  notes: string | null
  createdAt: Date
  disciplines: DisciplineDetail[]
}

export type EventDetail = Omit<Event, 'ladvData'> & {
  ladvData: LadvAusschreibung | null
  registrations: RegistrationDetail[]
}

export type EventPublicRegistrationCounts = Partial<Record<RegistrationStatus, number>>

export type EventPublicDetail = Omit<Event, 'ladvData' | 'createdBy'> & {
  ladvData: LadvAusschreibung | null
  registrationCounts: EventPublicRegistrationCounts
}

export type EventListPublicItem = Omit<EventListItem, 'ownRegistrationStatus' | 'ownRegistrationId' | 'createdBy'>

export type EventResponse = EventDetail | EventPublicDetail
export type EventListResponse = EventListItem[] | EventListPublicItem[]

export type LadvTodoDiscipline = {
  id: string
  discipline: string
  ageClass: string
}

export type LadvTodo = {
  type: 'register' | 'cancel'
  eventId: string
  eventName: string
  eventDate: string | null
  ladvId: number | null
  registrationId: string
  disciplines: LadvTodoDiscipline[]
  userId: string
  firstName: string | null
  lastName: string | null
}

export type MyRegistration = {
  id: string
  status: RegistrationStatus
  notes: string | null
  createdAt: Date
  event: {
    id: string
    name: string
    date: string | null
    type: EventType
    cancelledAt: Date | null
    registrationDeadline: string | null
  }
  disciplines: DisciplineDetail[]
}
