import { EmailClient } from '@azure/communication-email'
import type { EmailOptions, EmailService } from '../types'
import { TemplateService } from './template'
import { emailConfig } from '../config'

/**
 * E-Mail-Service-Implementierung, die Azure Communication Services verwendet
 */
export class AzureEmailService implements EmailService {
  private client: EmailClient
  private templateService: TemplateService
  private senderAddress: string

  constructor() {
    const connectionString = emailConfig.azureConnectionString
    if (!connectionString) {
      throw new Error(
        'Azure Communication Connection String ist nicht gesetzt in der Konfiguration'
      )
    }

    if (!emailConfig.senderAddress) {
      throw new Error(
        'Sender Email Address ist nicht gesetzt in der Konfiguration'
      )
    }

    this.client = new EmailClient(connectionString)
    this.templateService = TemplateService.getInstance()
    this.senderAddress = emailConfig.senderAddress
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const htmlContent = await this.templateService.render(
        options.template,
        options.data
      )

      const emailMessage = {
        senderAddress: this.senderAddress,
        content: {
          subject: options.subject,
          html: htmlContent,
          plainText: this.convertHtmlToPlainText(htmlContent),
        },
        recipients: {
          to: options.to,
        },
      }

      console.log('Versuche E-Mail zu senden an:', options.to)
      const poller = await this.client.beginSend(emailMessage)
      const result = await poller.pollUntilDone()

      if (result.status === 'Succeeded') {
        console.log('E-Mail erfolgreich gesendet:', result.id)
      } else {
        console.error('E-Mail-Zustellung fehlgeschlagen:', result)
        throw new Error(`E-Mail-Zustellung fehlgeschlagen: ${result.status}`)
      }
    } catch (error) {
      console.error('Fehler beim Senden der E-Mail:', {
        error: error instanceof Error ? error.message : 'Unbekannter Fehler',
        stack: error instanceof Error ? error.stack : undefined,
        recipient: options.to,
        subject: options.subject,
      })
      throw error
    }
  }

  private convertHtmlToPlainText(html: string): string {
    // Einfache Konvertierung von HTML zu Plain Text
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\n\s*\n/g, '\n')
      .trim()
  }
}
