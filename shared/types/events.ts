import type { Event } from './db'
import type { LadvAusschreibung } from './ladv'
import type { EventType, RegistrationStatus } from '../utils/registration'

// Event-IDs werden in der API als Sqid-Strings zurückgegeben (enkodierter Integer)
export type EventListItem = Omit<Event, 'ladvData' | 'id'> & {
  id: string
  participantCount: number
  ownRegistrationStatus: 'registered' | 'canceled' | 'maybe' | 'yes' | 'no' | null
  ownRegistrationId: number | null
}

export type DisciplineDetail = {
  id: number
  discipline: string
  ageClass: string
  ladvRegisteredAt: Date | null
  ladvRegisteredBy: number | null
  ladvCanceledAt: Date | null
  ladvCanceledBy: number | null
}

export type RegistrationDetail = {
  id: number
  userId: number
  firstName: string | null
  lastName: string | null
  hasAvatar: boolean
  status: 'registered' | 'canceled' | 'maybe' | 'yes' | 'no'
  notes: string | null
  createdAt: Date
  disciplines: DisciplineDetail[]
}

export type EventDetail = Omit<Event, 'ladvData' | 'id'> & {
  id: string
  ladvData: LadvAusschreibung | null
  registrations: RegistrationDetail[]
}

export type EventPublicRegistrationCounts = Partial<Record<RegistrationStatus, number>>

export type EventPublicDetail = Omit<Event, 'ladvData' | 'createdBy' | 'id'> & {
  id: string
  ladvData: LadvAusschreibung | null
  registrationCounts: EventPublicRegistrationCounts
}

export type EventListPublicItem = Omit<EventListItem, 'ownRegistrationStatus' | 'ownRegistrationId' | 'createdBy'>

export type EventResponse = EventDetail | EventPublicDetail
export type EventListResponse = EventListItem[] | EventListPublicItem[]

export type LadvTodoDiscipline = {
  id: number
  discipline: string
  ageClass: string
}

export type LadvTodo = {
  type: 'register' | 'cancel'
  eventId: string // Sqid — wird für URL-Navigation genutzt
  eventName: string
  eventDate: string | null
  ladvId: number | null
  registrationId: number
  disciplines: LadvTodoDiscipline[]
  userId: number
  firstName: string | null
  lastName: string | null
}

export type MyRegistration = {
  id: number
  status: RegistrationStatus
  notes: string | null
  createdAt: Date
  event: {
    id: string // Sqid — wird für URL-Navigation genutzt
    name: string
    date: string | null
    type: EventType
    cancelledAt: Date | null
    registrationDeadline: string | null
  }
  disciplines: DisciplineDetail[]
}
