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
   * Aktualisiert den Status einer Registrierung
   * Hinweis: Erfordert Service-Role-Berechtigungen
   */
  async updateStatus(
    id: number,
    status: 'confirmed' | 'canceled' | 'pending'
  ): Promise<boolean> {
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
