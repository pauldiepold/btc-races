import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import type { EmailOptions, EmailService } from './types'
import { createEmailService } from './factory'
import { emailConfig } from './config'

/**
 * E-Mail-Manager, der verschiedene E-Mail-Dienste kapselt
 * und zusätzliche Funktionen wie Test-Modus bietet
 */
export class EmailManager implements EmailService {
  private supabase: SupabaseClient<Database>
  private emailService: EmailService
  private testMode: boolean
  private testEmail: string

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase
    this.emailService = createEmailService()
    this.testMode = emailConfig.testMode
    this.testEmail = emailConfig.testAddress

    if (this.testMode) {
      console.log(
        `[EmailManager] Testmodus aktiv. Alle E-Mails werden an ${this.testEmail} umgeleitet.`
      )
    }
  }

  /**
   * Sendet eine E-Mail mit optional überschriebenen Empfängern im Testmodus
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    let recipients = options.to
    let subject = options.subject

    if (this.testMode) {
      // Im Testmodus werden alle Empfänger mit der Test-E-Mail-Adresse überschrieben
      // und der Betreff wird gekennzeichnet
      const originalRecipients = recipients
        .map((r) => `${r.displayName} <${r.address}>`)
        .join(', ')

      recipients = [
        {
          address: this.testEmail,
          displayName: 'Test-Empfänger',
        },
      ]

      subject = `[TEST] ${subject} (Original: ${originalRecipients})`

      console.log(
        `[EmailManager] Empfänger überschrieben: ${originalRecipients} -> ${this.testEmail}`
      )
    }

    try {
      // E-Mail mit möglicherweise geänderten Empfängern und Betreff senden
      await this.emailService.sendEmail({
        ...options,
        to: recipients,
        subject: subject,
      })

      console.log(
        `[EmailManager] E-Mail erfolgreich gesendet an: ${recipients
          .map((r) => r.address)
          .join(', ')}`
      )
    } catch (error) {
      console.error('[EmailManager] Fehler beim Senden der E-Mail:', error)
      throw error
    }
  }

  /**
   * Rendert eine E-Mail-Vorlage mit den gegebenen Daten
   */
  private renderTemplate(
    templateName: string,
    data?: Record<string, any>
  ): string {
    // TODO: Implementiere Template-Rendering
    // Hier könnte z.B. eine Template-Engine wie Handlebars oder EJS verwendet werden
    return `Template: ${templateName} mit Daten: ${JSON.stringify(data)}`
  }
}
