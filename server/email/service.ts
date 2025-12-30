import type {
  EmailMessage,
  EmailProvider,
} from '~~/server/email/email.types'
import { AzureEmailProvider } from './providers/azure'
import { LocalEmailProvider } from './providers/console'

/**
 * Service für den Versand von E-Mails
 *
 * Verwendung in Nuxt Server Endpoints:
 * ```typescript
 * import { emailService } from '~/server/email/service'
 *
 * export default defineEventHandler(async (event) => {
 *   await emailService.sendEmail({
 *     to: [{ address: 'user@example.com', displayName: 'Max Mustermann' }],
 *     subject: 'Willkommen',
 *     html: '<p>Hallo Max!</p>',
 *     text: 'Hallo Max!'
 *   })
 * })
 * ```
 */
class EmailService {
  private provider: EmailProvider
  private testMode: boolean
  private testAddress: string
  private senderAddress: string

  constructor() {
    const config = useRuntimeConfig()

    // Config direkt aus runtimeConfig
    this.testMode = config.emailTestMode
    this.testAddress = config.emailTestAddress
    this.senderAddress = config.emailSenderAddress

    // Provider basierend auf Konfiguration erstellen
    if (config.emailProvider === 'azure') {
      this.provider = new AzureEmailProvider(
        config.emailAzureString,
        config.emailSenderAddress,
      )
      console.log('ℹ E-Mail: using Azure provider')
    }
    else {
      this.provider = new LocalEmailProvider()
      console.log('ℹ Email Service: using console provider')
    }
  }

  /**
   * Sendet eine E-Mail mit optional überschriebenen Empfängern im Testmodus
   */
  async sendEmail(message: EmailMessage): Promise<void> {
    let recipients = message.to
    let subject = message.subject

    // Wenn kein Absender angegeben ist, wird ein Standard-Absender verwendet
    const from = message.from || {
      address: this.senderAddress,
      displayName: 'BTC Races',
    }

    if (this.testMode) {
      // Im Testmodus: Empfänger überschreiben und Betreff markieren
      const originalRecipients = message.to
        .map(r => `${r.displayName || ''} <${r.address}>`)
        .join(', ')

      recipients = [
        {
          address: this.testAddress,
          displayName: 'Test-Empfänger',
        },
      ]
      subject = `${message.subject} - ${originalRecipients}`

      console.log(
        `[EmailService] Empfänger umgeleitet: ${originalRecipients} -> ${this.testAddress}`,
      )
    }

    try {
      await this.provider.sendEmail({
        ...message,
        from,
        to: recipients,
        subject: subject,
      })

      console.log(
        `[EmailService] E-Mail erfolgreich gesendet an: ${recipients
          .map(r => r.address)
          .join(', ')}`,
      )
    }
    catch (error) {
      console.error('[EmailService] Fehler beim Senden der E-Mail:', error)
      throw error
    }
  }
}

// Singleton-Instanz für wiederverwendbaren Zugriff
export const emailService = new EmailService()
