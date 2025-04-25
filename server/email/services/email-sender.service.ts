import type {
  EmailMessage,
  EmailProvider,
  EmailRecipient,
} from '~/types/email.types'
import { emailConfig } from '../config'
import { AzureEmailProvider } from '../providers/azure'
import { LocalEmailProvider } from '../providers/local'

/**
 * Service für den Versand von E-Mails
 */
export class EmailSenderService {
  private emailProvider: EmailProvider

  constructor() {
    // Provider-Erstellung basierend auf der Konfiguration
    this.emailProvider =
      emailConfig.provider === 'azure'
        ? new AzureEmailProvider()
        : new LocalEmailProvider()

    if (this.isTestModeActive()) {
      console.log(
        `[EmailSenderService] Testmodus aktiv. Alle E-Mails werden an ${emailConfig.testAddress} umgeleitet.`
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
  async sendEmail(message: EmailMessage): Promise<void> {
    let recipients = message.to
    let subject = message.subject

    if (this.isTestModeActive()) {
      // Im Testmodus werden alle Empfänger mit der Test-E-Mail-Adresse überschrieben
      // und der Betreff wird gekennzeichnet
      recipients = this.transformRecipients(message.to)
      subject = this.transformSubject(message.subject, message.to)

      console.log(
        `[EmailSenderService] Empfänger überschrieben: ${message.to
          .map((r: EmailRecipient) => `${r.displayName} <${r.address}>`)
          .join(', ')} -> ${emailConfig.testAddress}`
      )
    }

    try {
      await this.emailProvider.sendEmail({
        ...message,
        to: recipients,
        subject: subject,
      })

      console.log(
        `[EmailSenderService] E-Mail erfolgreich gesendet an: ${recipients
          .map((r: EmailRecipient) => r.address)
          .join(', ')}`
      )
    } catch (error) {
      console.error(
        '[EmailSenderService] Fehler beim Senden der E-Mail:',
        error
      )
      throw error
    }
  }
}
