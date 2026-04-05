import type { Event } from './db'

export type EventListItem = Omit<Event, 'ladvData'> & {
  participantCount: number
  ownRegistrationStatus: 'registered' | 'canceled' | 'maybe' | 'yes' | 'no' | null
  ownRegistrationId: string | null
}
