import type { SupabaseClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'
import { EmailManager } from '../manager'
import type {
  EmailType,
  EmailLogInsert,
  EmailContext,
  RegistrationWithDetails,
} from '../types'
import type { Database } from '~/types/database.types'

export class RegistrationEmailService {
  private supabase: SupabaseClient<Database>
  private emailManager: EmailManager

  // Gültigkeitsdauer des Tokens in Millisekunden (7 Tage)
  private readonly TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase
    this.emailManager = new EmailManager()
  }

  /**
   * Generiert einen zufälligen Token für E-Mail-Bestätigungen
   */
  private generateToken(): string {
    return randomBytes(32).toString('hex')
  }

  /**
   * Hilfsmethode zum Laden der Registrierungsdaten aus der Datenbank
   * Nutzt die neue View registrations_with_details
   */
  private async loadRegistrationData(
    registrationId: number
  ): Promise<RegistrationWithDetails> {
    const { data: registration, error } = await this.supabase
      .from('registrations_with_details')
      .select('*')
      .eq('id', registrationId)
      .single()

    if (error || !registration) {
      throw new Error(
        `Registrierung mit ID ${registrationId} nicht gefunden: ${error?.message}`
      )
    }

    if (!registration.member_email) {
      throw new Error(
        `Mitglied (ID: ${registration.member_id}) hat keine E-Mail-Adresse`
      )
    }

    return registration
  }

  /**
   * Gemeinsame Methode zum Versenden von E-Mails mit verschiedenen Kontexten
   */
  private async sendEmailWithToken(context: EmailContext): Promise<void> {
    // E-Mail in die Logs eintragen
    const emailLogData: EmailLogInsert = {
      registration_id: context.registrationId,
      email_type: context.emailType,
      recipient_email: context.member.email!,
      subject: context.subject,
      token: context.token,
      token_expires_at: context.tokenExpiresAt.toISOString(),
      status: 'pending',
    }

    const { error: logError } = await this.supabase
      .from('email_logs')
      .insert(emailLogData)

    if (logError) {
      throw new Error(
        `Fehler beim Protokollieren der E-Mail: ${logError.message}`
      )
    }

    try {
      // E-Mail senden
      await this.emailManager.sendEmail({
        to: [
          {
            address: context.member.email!,
            displayName: context.member.name!,
          },
        ],
        subject: context.subject,
        template: context.templateName,
        data: {
          firstName: context.member.name!.split(' ')[0],
          competitionName: context.competition.name,
          competitionDate: new Date(
            context.competition.date
          ).toLocaleDateString('de-DE'),
          [context.linkText]: `${process.env.PUBLIC_URL}/${context.linkUrlPath}?token=${context.token}`,
          expiryDate: context.tokenExpiresAt.toLocaleDateString('de-DE'),
        },
      })

      // Status aktualisieren
      await this.supabase
        .from('email_logs')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('registration_id', context.registrationId)
        .eq('email_type', context.emailType)
        .eq('token', context.token)

      console.log(
        `[RegistrationEmailService] E-Mail vom Typ "${context.emailType}" für Registrierung ${context.registrationId} gesendet`
      )
    } catch (error) {
      // Fehler protokollieren
      await this.supabase
        .from('email_logs')
        .update({
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
        })
        .eq('registration_id', context.registrationId)
        .eq('email_type', context.emailType)
        .eq('token', context.token)

      throw error
    }
  }

  /**
   * Sendet eine Anmeldebestätigungsmail für eine Registrierung
   */
  async sendConfirmationEmail(registrationId: number): Promise<void> {
    // Registrierungsdaten laden
    const registration = await this.loadRegistrationData(registrationId)

    // Token generieren und Ablaufdatum berechnen
    const token = this.generateToken()
    const tokenExpiresAt = new Date(Date.now() + this.TOKEN_EXPIRY_MS)

    // E-Mail mit entsprechendem Kontext senden
    await this.sendEmailWithToken({
      emailType: 'registration_confirmation',
      registrationId,
      member: {
        id: registration.member_id!,
        name: registration.member_name!,
        email: registration.member_email!,
        has_ladv_startpass: registration.has_ladv_startpass!,
        has_left: false, // TODO: Aus der View holen
        created_at: registration.created_at!,
        updated_at: registration.updated_at!,
      },
      competition: {
        name: registration.competition_name!,
        date: registration.competition_date!,
      },
      token,
      tokenExpiresAt,
      templateName: 'registration-confirmation',
      subject: `Anmeldebestätigung für ${registration.competition_name}`,
      linkUrlPath: 'confirm-registration',
      linkText: 'confirmationLink',
    })
  }

  /**
   * Sendet eine Bestätigungsmail für die Abmeldung von einem Wettkampf
   */
  async sendCancellationEmail(registrationId: number): Promise<void> {
    // Registrierungsdaten laden
    const registration = await this.loadRegistrationData(registrationId)

    // Token generieren und Ablaufdatum berechnen
    const token = this.generateToken()
    const tokenExpiresAt = new Date(Date.now() + this.TOKEN_EXPIRY_MS)

    // E-Mail mit entsprechendem Kontext senden
    await this.sendEmailWithToken({
      emailType: 'registration_cancellation',
      registrationId,
      member: {
        id: registration.member_id!,
        name: registration.member_name!,
        email: registration.member_email!,
        has_ladv_startpass: registration.has_ladv_startpass!,
        has_left: false, // TODO: Aus der View holen
        created_at: registration.created_at!,
        updated_at: registration.updated_at!,
      },
      competition: {
        name: registration.competition_name!,
        date: registration.competition_date!,
      },
      token,
      tokenExpiresAt,
      templateName: 'registration-cancellation',
      subject: `Abmeldebestätigung für ${registration.competition_name}`,
      linkUrlPath: 'confirm-cancellation',
      linkText: 'cancellationLink',
    })
  }

  /**
   * Prüft, ob ein Token gültig ist und führt die entsprechende Aktion aus
   */
  async validateToken(token: string): Promise<{
    success: boolean
    message: string
    emailType?: EmailType
    registrationId?: number
  }> {
    // E-Mail-Log mit dem gegebenen Token suchen
    const { data: emailLog, error } = await this.supabase
      .from('email_logs')
      .select('*')
      .eq('token', token)
      .single()

    if (error || !emailLog) {
      return {
        success: false,
        message: 'Ungültiger oder abgelaufener Token',
      }
    }

    // Prüfen, ob der Token abgelaufen ist
    const expiryDate = new Date(emailLog.token_expires_at!)
    if (expiryDate < new Date()) {
      return {
        success: false,
        message: 'Der Bestätigungslink ist abgelaufen',
      }
    }

    return {
      success: true,
      message: 'Token ist gültig',
      emailType: emailLog.email_type as EmailType,
      registrationId: emailLog.registration_id!,
    }
  }
}
