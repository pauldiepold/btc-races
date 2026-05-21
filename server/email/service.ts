import type {
  EmailMessage,
  EmailProvider,
} from '~~/server/email/email.types'
// import { AzureEmailProvider } from './providers/azure'
import { LocalEmailProvider } from './providers/console'
import { AzureFetchEmailProvider } from '~~/server/email/providers/azure-fetch'

/**
 * Service für den Versand von E-Mails
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
    /* if (config.emailProvider === 'azure') {
      this.provider = new AzureEmailProvider(
        config.emailAzureString,
        config.emailSenderAddress,
      )
      console.log('ℹ E-Mail: using Azure provider')
    } */
    if (config.emailProvider === 'azure-fetch') {
      this.provider = new AzureFetchEmailProvider(
        config.emailAzureString,
        config.emailSenderAddress,
      )
      console.log('ℹ E-Mail: using Azure native fetch provider')
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
      displayName: 'Berlin Track Club',
    }

    if (this.testMode && !message.bypassTestMode) {
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

    const bcc = this.testAddress && !(this.testMode && !message.bypassTestMode)
      ? [...(message.bcc ?? []), { address: this.testAddress, displayName: 'BCC-Kopie' }]
      : message.bcc

    try {
      await this.provider.sendEmail({
        ...message,
        from,
        to: recipients,
        subject: subject,
        bcc,
      })

      console.log(
        `[EmailService] E-Mail erfolgreich gesendet an: ${recipients
          .map(r => r.address)
          .join(', ')}`,
      )
    }
    catch (error) {
      console.error('[EmailService] Fehler beim Senden der E-Mail:', error)

      const originalRecipients = message.to.map(r => r.address).join(', ')
      const errorMessage = error instanceof Error ? error.message : String(error)

      try {
        await this.provider.sendEmail({
          from: { address: this.senderAddress, displayName: 'Berlin Track Club' },
          to: [{ address: 'paul.diepold@outlook.de', displayName: 'Paul' }],
          subject: `[BTC Races] E-Mail-Versand fehlgeschlagen`,
          html: `<p>Eine E-Mail konnte nicht zugestellt werden.</p><p><strong>Empfänger:</strong> ${originalRecipients}<br><strong>Betreff:</strong> ${message.subject}<br><strong>Fehler:</strong> ${errorMessage}</p>`,
          text: `Eine E-Mail konnte nicht zugestellt werden.\n\nEmpfänger: ${originalRecipients}\nBetreff: ${message.subject}\nFehler: ${errorMessage}`,
        })
      }
      catch (notifyError) {
        console.error('[EmailService] Admin-Benachrichtigung fehlgeschlagen:', notifyError)
      }

      throw error
    }
  }
}

// Singleton-Instanz für wiederverwendbaren Zugriff
export const emailService = new EmailService()
