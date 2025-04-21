import type { SupabaseClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'
import { EmailManager } from '../manager'
import { emailConfig } from '../config'
import type {
  EmailType,
  EmailLogInsert,
  RegistrationEmailParams,
  RegistrationWithDetails,
} from '~/types/email.types'
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
  private async sendEmailWithToken(
    params: RegistrationEmailParams
  ): Promise<void> {
    try {
      // E-Mail senden
      await this.emailManager.sendEmail({
        to: [
          {
            address: params.memberEmail,
            displayName: params.memberName,
          },
        ],
        subject: params.subject,
        content: '', // Leerer Content, da wir das Template verwenden
        template: {
          name: params.templateName,
          data: {
            firstName: params.memberName.split(' ')[0],
            competitionName: params.competitionName,
            competitionDate: new Date(
              params.competitionDate
            ).toLocaleDateString('de-DE'),
            [params.linkText]: `${emailConfig.publicUrl}/${params.linkUrlPath}?token=${params.token}`,
            expiryDate: params.tokenExpiresAt.toLocaleDateString('de-DE'),
          },
        },
      })

      // E-Mail in die Logs eintragen
      const emailLogData: EmailLogInsert = {
        registration_id: params.registrationId,
        email_type: params.emailType,
        recipient_email: params.memberEmail,
        subject: params.subject,
        token: params.token,
        token_expires_at: params.tokenExpiresAt.toISOString(),
        status: 'sent',
        sent_at: new Date().toISOString(),
      }

      const { error: logError } = await this.supabase
        .from('email_logs')
        .insert(emailLogData)

      if (logError) {
        throw new Error(
          `Fehler beim Protokollieren der E-Mail: ${logError.message}`
        )
      }

      console.log(
        `[RegistrationEmailService] E-Mail vom Typ "${params.emailType}" für Registrierung ${params.registrationId} gesendet`
      )
    } catch (error) {
      // Fehler protokollieren
      const emailLogData: EmailLogInsert = {
        registration_id: params.registrationId,
        email_type: params.emailType,
        recipient_email: params.memberEmail,
        subject: params.subject,
        token: params.token,
        token_expires_at: params.tokenExpiresAt.toISOString(),
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unbekannter Fehler',
      }

      await this.supabase.from('email_logs').insert(emailLogData)

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
      memberName: registration.member_name!,
      memberEmail: registration.member_email!,
      competitionName: registration.competition_name!,
      competitionDate: registration.competition_date!,
      token,
      tokenExpiresAt,
      templateName: 'registration-confirmation',
      subject: `Anmeldebestätigung für ${registration.competition_name}`,
      linkUrlPath: 'registrations/confirm',
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
      memberName: registration.member_name!,
      memberEmail: registration.member_email!,
      competitionName: registration.competition_name!,
      competitionDate: registration.competition_date!,
      token,
      tokenExpiresAt,
      templateName: 'registration-cancellation',
      subject: `Abmeldebestätigung für ${registration.competition_name}`,
      linkUrlPath: 'reigstrations/cancel',
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
