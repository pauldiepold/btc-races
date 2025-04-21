import { SentEmailsClientRepository } from '~/repositories/sent-emails/sent-emails.repository'
import { CompetitionsClientRepository } from '~/repositories/competitions/competitions.repository'
import { MembersClientRepository } from '~/repositories/members/members.repository'
import { RegistrationsClientRepository } from '~/repositories/registrations/registrations.repository'

/**
 * Composable, das Zugriff auf alle Client-Repositories bietet
 */
export function useRepositories() {
  const sentEmails = new SentEmailsClientRepository()
  const competitions = new CompetitionsClientRepository()
  const members = new MembersClientRepository()
  const registrations = new RegistrationsClientRepository()

  return {
    sentEmails,
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
