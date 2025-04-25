import type { H3Event } from 'h3'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import { BaseRepository } from '~/repositories/base/base.repository'
import {
  createRepository,
  type ClientType,
} from '~/server/repositories/base/repository.factory'
import type {
  Registration,
  RegistrationInsert,
  RegistrationUpdate,
  RegistrationWithDetailsView,
} from '~/types/models.types'
import type { RegistrationStatus } from '~/types/enums'
export class RegistrationsRepository extends BaseRepository<
  'registrations',
  Registration,
  RegistrationInsert,
  RegistrationUpdate
> {
  constructor(client: SupabaseClient<Database>) {
    super(client, 'registrations')
  }

  /**
   * Erstellt eine neue Registrierung
   */
  async create(data: RegistrationInsert): Promise<Registration | null> {
    const { data: result, error } = await this.supabase
      .from(this.tableName)
      .insert(data)
      .select()
      .single()

    if (error) {
      console.error('Fehler beim Erstellen der Registrierung:', error)
      throw error // Fehler weitergeben für Validierung
    }

    return result
  }

  /**
   * Findet eine Registrierung mit allen detaillierten Informationen
   */
  async findWithDetails(
    id: number
  ): Promise<RegistrationWithDetailsView | null> {
    const { data, error } = await this.supabase
      .from('registrations_with_details')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error(
        `Fehler beim Laden der Registrierung mit Details für ID ${id}:`,
        error
      )
      return null
    }

    return data
  }

  /**
   * Findet eine abgemeldete Registrierung für einen bestimmten Benutzer und Wettkampf
   * Kann für die Reaktivierung verwendet werden, wenn sich ein Benutzer erneut anmeldet
   */
  async findCanceledRegistration(
    memberId: number,
    competitionId: number
  ): Promise<Registration | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('member_id', memberId)
      .eq('competition_id', competitionId)
      .eq('status', 'canceled')
      .single()

    if (error) {
      // Wenn kein Eintrag gefunden wurde, ist das kein Fehler für unseren Use-Case
      if (error.code === 'PGRST116') {
        return null
      }

      console.error(
        `Fehler beim Suchen einer abgemeldeten Registrierung für Mitglied ${memberId} und Wettkampf ${competitionId}:`,
        error
      )
      return null
    }

    return data
  }

  /**
   * Prüft, ob ein Mitglied bereits aktiv für einen Wettkampf angemeldet ist
   * (Status ist entweder 'pending' oder 'confirmed')
   */
  async hasActiveRegistration(
    memberId: number,
    competitionId: number
  ): Promise<boolean> {
    const { error, count } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('member_id', memberId)
      .eq('competition_id', competitionId)
      .in('status', ['pending', 'confirmed'])

    if (error) {
      console.error(
        `Fehler beim Prüfen auf aktive Registrierung für Mitglied ${memberId} und Wettkampf ${competitionId}:`,
        error
      )
      return false
    }

    return (count || 0) > 0
  }

  /**
   * Aktualisiert den Status einer Registrierung
   * Hinweis: Erfordert Service-Role-Berechtigungen
   */
  async updateStatus(id: number, status: RegistrationStatus): Promise<boolean> {
    const { error } = await this.supabase
      .from(this.tableName)
      .update({ status })
      .eq('id', id)

    if (error) {
      console.error(
        `Fehler beim Aktualisieren des Status für Registrierung ${id}:`,
        error
      )
      return false
    }

    return true
  }

  /**
   * Aktualisiert eine Registrierung mit neuen Daten (z.B. Anmerkungen)
   * Nützlich für die Reaktivierung abgemeldeter Registrierungen
   */
  async updateRegistration(
    id: number,
    data: Partial<RegistrationUpdate>
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from(this.tableName)
      .update(data)
      .eq('id', id)

    if (error) {
      console.error(`Fehler beim Aktualisieren der Registrierung ${id}:`, error)
      return false
    }

    return true
  }
}

/**
 * Factory-Funktion für das Registrierungs-Repository
 * @param event HTTP-Event
 * @param clientType Gibt an, ob der authentifizierte Benutzer oder die Service-Role verwendet werden soll
 */
export async function createRegistrationsRepository(
  event: H3Event,
  clientType: ClientType = 'user'
): Promise<RegistrationsRepository> {
  return createRepository(event, RegistrationsRepository, clientType)
}
