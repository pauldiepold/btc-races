import { emailConfig } from '../config'
import type { RegistrationWithDetailsView } from '~/types/models.types'

/**
 * Interface für allgemeine Template-Daten
 */
export interface TemplateData {
  [key: string]: any
}

/**
 * Service für die Aufbereitung von E-Mail-Template-Daten
 */
export class TemplateService {
  /**
   * Bereitet Daten für ein Anmeldebestätigungs-Template vor
   */
  prepareRegistrationConfirmationData(
    registration: RegistrationWithDetailsView,
    token: string,
    expiryDate: Date
  ): TemplateData {
    return {
      firstName: this.extractFirstName(registration.member_name),
      competitionName: registration.competition_name,
      competitionDate: this.formatDate(registration.competition_date),
      confirmationLink: this.buildLink('/registrations/confirm', token),
      expiryDate: this.formatDate(expiryDate.toISOString()),
    }
  }

  /**
   * Bereitet Daten für ein Abmeldebestätigungs-Template vor
   */
  prepareRegistrationCancellationData(
    registration: RegistrationWithDetailsView,
    token: string,
    expiryDate: Date
  ): TemplateData {
    return {
      firstName: this.extractFirstName(registration.member_name),
      competitionName: registration.competition_name,
      competitionDate: this.formatDate(registration.competition_date),
      cancellationLink: this.buildLink('/registrations/cancel', token),
      expiryDate: this.formatDate(expiryDate.toISOString()),
    }
  }

  /**
   * Bereitet Daten für eine Wettkampf-Erinnerungs-E-Mail vor
   */
  prepareCompetitionReminderData(
    registration: RegistrationWithDetailsView
  ): TemplateData {
    return {
      firstName: this.extractFirstName(registration.member_name),
      competitionName: registration.competition_name,
      competitionDate: this.formatDate(registration.competition_date),
      competitionLocation:
        registration.competition_location || 'nicht angegeben',
    }
  }

  /**
   * Hilfsmethode: Extrahiert den Vornamen aus einem vollständigen Namen
   */
  private extractFirstName(fullName: string | null): string {
    if (!fullName) return ''
    return fullName.split(' ')[0]
  }

  /**
   * Hilfsmethode: Formatiert ein Datum in deutsches Format
   */
  private formatDate(dateString: string | null): string {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('de-DE')
  }

  /**
   * Hilfsmethode: Erstellt einen Link mit Token
   */
  private buildLink(path: string, token: string): string {
    return `${emailConfig.publicUrl}${path}?token=${token}`
  }
}
