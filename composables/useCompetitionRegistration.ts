import type { Competition } from '~/types/models.types'

export type CompetitionRegistrationStatus =
  | 'REGISTRATION_OPEN' // Anmeldung möglich
  | 'REGISTRATION_CLOSED' // Meldefrist verstrichen
  | 'COMPETITION_ENDED' // Wettkampf beendet

export function useCompetitionRegistration(
  competition: Competition
): CompetitionRegistrationStatus {
  const today = new Date().setHours(0, 0, 0, 0)
  const deadline = new Date(competition.registration_deadline).setHours(
    0,
    0,
    0,
    0
  )
  const date = new Date(competition.date).setHours(0, 0, 0, 0)

  if (today < deadline) {
    return 'REGISTRATION_OPEN'
  }

  if (today < date) {
    return 'REGISTRATION_CLOSED'
  }

  return 'COMPETITION_ENDED'
}
