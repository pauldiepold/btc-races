import type {
  EmailMessage,
  EmailProvider,
  EmailRecipient,
} from '~/types/email.types'
import { emailConfig } from './config'
import { AzureEmailProvider } from './providers/azure'
import { LocalEmailProvider } from './providers/local'

/**
 * E-Mail-Manager, der verschiedene E-Mail-Provider verwaltet
 * und zusätzliche Funktionen wie Test-Modus bietet
 */
export class EmailManager {
  private emailProvider: EmailProvider

  constructor() {
    // Provider-Erstellung basierend auf der Konfiguration
    this.emailProvider =
      emailConfig.provider === 'azure'
        ? new AzureEmailProvider()
        : new LocalEmailProvider()

    if (this.isTestModeActive()) {
      console.log(
        `[EmailManager] Testmodus aktiv. Alle E-Mails werden an ${emailConfig.testAddress} umgeleitet.`
      )
    }
  }

  /**
   * Prüft, ob der Testmodus aktiv ist
   */
  private isTestModeActive(): boolean {
    return emailConfig.testMode
  }

  /**
   * Transformiert die Empfänger im Testmodus
   */
  private transformRecipients(_recipients: EmailRecipient[]): EmailRecipient[] {
    return [
      {
        address: emailConfig.testAddress,
        displayName: 'Test-Empfänger',
      },
    ]
  }

  /**
   * Transformiert den Betreff im Testmodus
   */
  private transformSubject(
    subject: string,
    originalRecipients: EmailRecipient[]
  ): string {
    const recipientList = originalRecipients
      .map((r) => `${r.displayName} <${r.address}>`)
      .join(', ')
    return `[TEST] ${subject} (Original: ${recipientList})`
  }

  /**
   * Sendet eine E-Mail mit optional überschriebenen Empfängern im Testmodus
   */
  async sendEmail(options: EmailMessage): Promise<void> {
    let recipients = options.to
    let subject = options.subject

    if (this.isTestModeActive()) {
      // Im Testmodus werden alle Empfänger mit der Test-E-Mail-Adresse überschrieben
      // und der Betreff wird gekennzeichnet
      recipients = this.transformRecipients(options.to)
      subject = this.transformSubject(options.subject, options.to)

      console.log(
        `[EmailManager] Empfänger überschrieben: ${options.to
          .map((r: EmailRecipient) => `${r.displayName} <${r.address}>`)
          .join(', ')} -> ${emailConfig.testAddress}`
      )
    }

    try {
      await this.emailProvider.sendEmail({
        ...options,
        to: recipients,
        subject: subject,
      })

      console.log(
        `[EmailManager] E-Mail erfolgreich gesendet an: ${recipients
          .map((r: EmailRecipient) => r.address)
          .join(', ')}`
      )
    } catch (error) {
      console.error('[EmailManager] Fehler beim Senden der E-Mail:', error)
      throw error
    }
  }
}
