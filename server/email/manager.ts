import type { EmailOptions, EmailService } from './types'
import { createEmailService } from './factory'
import { emailConfig } from './config'

/**
 * E-Mail-Manager, der verschiedene E-Mail-Dienste kapselt
 * und zusätzliche Funktionen wie Test-Modus bietet
 */
export class EmailManager {
  private emailService: EmailService
  private testMode: boolean
  private testEmail: string

  constructor() {
    // E-Mail-Service über die Factory erstellen
    this.emailService = createEmailService()

    // Testmodus und Test-E-Mail-Adresse aus der Konfiguration laden
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

    // E-Mail mit möglicherweise geänderten Empfängern und Betreff senden
    await this.emailService.sendEmail({
      ...options,
      to: recipients,
      subject: subject,
    })
  }
}
