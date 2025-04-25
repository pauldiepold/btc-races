import { ClientRepository } from './base/client.repository'
import type {
  Registration,
  RegistrationInsert,
  RegistrationUpdate,
} from '~/types/models.types'

export class RegistrationsClientRepository extends ClientRepository<
  'registrations',
  Registration,
  RegistrationInsert,
  RegistrationUpdate
> {
  constructor() {
    super('registrations')
  }

  /**
   * Neueste Registrierungen mit Details zu Mitglied und Wettkampf abrufen
   * @param limit Anzahl der Einträge, die zurückgegeben werden sollen
   * @returns Liste der neuesten Registrierungen
   */
  async findNewestWithDetails(limit: number = 5): Promise<any[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        `
        *,
        member:members(name),
        competition:competitions(name)
      `
      )
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error(`Fehler beim Laden der neuesten Registrierungen:`, error)
      return []
    }

    return data || []
  }

  /**
   * Registrierungen für einen bestimmten Wettbewerb abrufen
   * @param competitionId ID des Wettbewerbs
   * @returns Liste der Registrierungen für diesen Wettbewerb
   */
  async findByCompetitionId(competitionId: string | number): Promise<any[]> {
    // String ID in Number konvertieren, falls notwendig
    const numericId =
      typeof competitionId === 'string'
        ? parseInt(competitionId)
        : competitionId

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        `
        id,
        status,
        notes,
        created_at,
        member:members (
          id,
          name
        )
      `
      )
      .eq('competition_id', numericId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error(
        `Fehler beim Laden der Registrierungen für Wettbewerb ${competitionId}:`,
        error
      )
      return []
    }

    return data || []
  }
}
