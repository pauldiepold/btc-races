import type { Event, RegistrationDisciplinePair } from './db'
import type { LadvAusschreibung, LadvWettbewerb } from './ladv'
import type { EventType, RegistrationStatus } from '../utils/registration'
import type { LadvRegistrationDiffEntry } from '../utils/ladv-diff'

// Event-IDs werden in der API als Sqid-Strings zurückgegeben (enkodierter Integer)
export type EventListItem = Omit<Event, 'ladvData' | 'id'> & {
  id: string
  participantCount: number
  ownRegistrationStatus: 'registered' | 'canceled' | 'maybe' | 'yes' | 'no' | null
  ownRegistrationId: number | null
}

export type RegistrationDetail = {
  id: number
  userId: number
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
  status: 'registered' | 'canceled' | 'maybe' | 'yes' | 'no'
  notes: string | null
  createdAt: Date
  wishDisciplines: RegistrationDisciplinePair[]
  ladvDisciplines: RegistrationDisciplinePair[] | null
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

export type LadvTodo = {
  type: 'register' | 'cancel'
  eventId: string // Sqid — wird für URL-Navigation genutzt
  eventName: string
  eventDate: string | null
  ladvId: number | null
  registrationId: number
  diff: LadvRegistrationDiffEntry[]
  wishDisciplines: RegistrationDisciplinePair[]
  userId: number
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
}

export type RegistrationCoachView = {
  id: number
  status: RegistrationStatus
  notes: string | null
  userId: number
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
  wishDisciplines: RegistrationDisciplinePair[]
  ladvDisciplines: RegistrationDisciplinePair[] | null
  event: {
    id: string
    name: string
    date: string | null
    ladvId: number | null
    wettbewerbe: LadvWettbewerb[]
  }
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
  wishDisciplines: RegistrationDisciplinePair[]
  ladvDisciplines: RegistrationDisciplinePair[] | null
}
