import { ClientRepository } from './base/client.repository'
import type {
  Competition,
  CompetitionInsert,
  CompetitionUpdate,
} from '~/types/models.types'

export class CompetitionsClientRepository extends ClientRepository<
  'competitions',
  Competition,
  CompetitionInsert,
  CompetitionUpdate
> {
  constructor() {
    super('competitions')
  }

  /**
   * Alle Wettbewerbe sortiert nach Datum abrufen
   */
  async findAllOrderedByDate(ascending = true): Promise<Competition[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select()
      .order('date', { ascending })

    if (error) {
      console.error(`Fehler beim Laden der Wettbewerbe:`, error)
      return []
    }

    return data || []
  }

  /**
   * Aktive Wettbewerbe abrufen (Datum >= heute)
   * @param limit Maximale Anzahl an zurückgegebenen Wettbewerben
   * @returns Liste der aktiven Wettbewerbe mit Anzahl der Registrierungen
   */
  async findActiveWithRegistrationsCount(limit: number = 5): Promise<any[]> {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        `
        *,
        registrations:registrations(count)
      `
      )
      .gte('date', today)
      .order('date', { ascending: true })
      .limit(limit)

    if (error) {
      console.error(`Fehler beim Laden der aktiven Wettbewerbe:`, error)
      return []
    }

    return data || []
  }

  /**
   * Anzahl aktiver Wettbewerbe zählen (Datum >= heute)
   * @returns Anzahl der aktiven Wettbewerbe
   */
  async countActive(): Promise<number> {
    const today = new Date().toISOString().split('T')[0]

    const { count, error } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .gte('date', today)

    if (error) {
      console.error(`Fehler beim Zählen aktiver Wettbewerbe:`, error)
      return 0
    }

    return count || 0
  }
}
