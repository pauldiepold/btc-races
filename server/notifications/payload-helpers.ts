import { formatEventDate } from '~~/shared/utils/events'
import { ladvAgeClassLabel, ladvDisciplineLabel } from '~~/shared/utils/ladv-labels'
import type { RegistrationDisciplinePair } from '~~/shared/types/db'

interface EventPayloadInput {
  id: number
  name: string
  date: string | null
  location: string | null
  registrationDeadline: string | null
}

/**
 * Standard-Felder, die in fast allen Event-bezogenen Notification-Payloads gleich aussehen.
 */
export function buildEventPayload(dbEvent: EventPayloadInput, siteUrl: string) {
  return {
    eventName: dbEvent.name,
    eventDate: formatEventDate(dbEvent.date) ?? undefined,
    eventLocation: dbEvent.location ?? undefined,
    registrationDeadline: formatEventDate(dbEvent.registrationDeadline) ?? undefined,
    eventLink: `${siteUrl}/${encodeEventId(dbEvent.id)}`,
  }
}

export function formatDisciplineLabels(disciplines: RegistrationDisciplinePair[]): string[] {
  return disciplines.map(d => `${ladvDisciplineLabel(d.discipline)} (${ladvAgeClassLabel(d.ageClass)})`)
}

const berlinDateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' })

export function isEventDateInPastBerlin(date: string | null): boolean {
  if (!date) return false
  const today = berlinDateFormatter.format(new Date())
  return date < today
}
