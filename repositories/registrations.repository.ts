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
        ladv_registered_at,
        ladv_registered_by,
        ladv_canceled_at,
        ladv_canceled_by,
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

  /**
   * LADV-Anmeldung für eine Registrierung
   * @param registrationId ID der Registrierung
   * @param userName Vollständiger Name des Users für die Abkürzung
   * @returns Erfolg der Operation
   */
  async registerToLADV(
    registrationId: string | number,
    userName: string
  ): Promise<{ success: boolean; error?: string }> {
    // Namen abkürzen: "Max Mustermann" -> "Max M."
    const abbreviatedName = this.abbreviateName(userName)

    // ID zu Number konvertieren falls String
    const numericId =
      typeof registrationId === 'string'
        ? parseInt(registrationId)
        : registrationId

    const { error } = await this.supabase
      .from(this.tableName)
      .update({
        ladv_registered_at: new Date().toISOString(),
        ladv_registered_by: abbreviatedName,
        ladv_canceled_at: null,
        ladv_canceled_by: null,
      })
      .eq('id', numericId)

    if (error) {
      console.error(
        `Fehler bei LADV-Anmeldung für Registrierung ${registrationId}:`,
        error
      )
      return { success: false, error: error.message }
    }

    return { success: true }
  }

  /**
   * LADV-Abmeldung für eine Registrierung
   * @param registrationId ID der Registrierung
   * @param userName Vollständiger Name des Users für die Abkürzung
   * @returns Erfolg der Operation
   */
  async cancelFromLADV(
    registrationId: string | number,
    userName: string
  ): Promise<{ success: boolean; error?: string }> {
    // Namen abkürzen: "Max Mustermann" -> "Max M."
    const abbreviatedName = this.abbreviateName(userName)

    // ID zu Number konvertieren falls String
    const numericId =
      typeof registrationId === 'string'
        ? parseInt(registrationId)
        : registrationId

    const { error } = await this.supabase
      .from(this.tableName)
      .update({
        ladv_canceled_at: new Date().toISOString(),
        ladv_canceled_by: abbreviatedName,
      })
      .eq('id', numericId)

    if (error) {
      console.error(
        `Fehler bei LADV-Abmeldung für Registrierung ${registrationId}:`,
        error
      )
      return { success: false, error: error.message }
    }

    return { success: true }
  }

  /**
   * Namen abkürzen: "Max Mustermann" -> "Max M."
   * @param fullName Vollständiger Name
   * @returns Abgekürzter Name
   */
  private abbreviateName(fullName: string): string {
    const nameParts = fullName.trim().split(' ')
    if (nameParts.length < 2) {
      return fullName // Falls nur ein Name vorhanden ist
    }

    const firstName = nameParts[0]
    const lastNameInitial = nameParts[nameParts.length - 1]
      .charAt(0)
      .toUpperCase()

    return `${firstName} ${lastNameInitial}.`
  }
}
