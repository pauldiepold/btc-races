import { CompetitionsClientRepository } from '~/repositories/competitions.repository'
import { MembersClientRepository } from '~/repositories/members.repository'
import { RegistrationsClientRepository } from '~/repositories/registrations.repository'

/**
 * Composable, das Zugriff auf alle Client-Repositories bietet
 */
export function useRepositories() {
  const competitions = new CompetitionsClientRepository()
  const members = new MembersClientRepository()
  const registrations = new RegistrationsClientRepository()

  return {
    competitions,
    members,
    registrations,
  }
}

/**
 * Beispiel für Verwendung:
 *
 * ```ts
 * // In einer Vue-Komponente
 * const { sentEmails, competitions, members, registrations } = useRepositories()
 *
 * // E-Mails mit Token finden
 * const email = await sentEmails.findByToken('token123')
 *
 * // Wettkämpfe abrufen
 * const allCompetitions = await competitions.findAllOrderedByDate()
 * ```
 */
