import { EmailClient } from '@azure/communication-email'
import type { EmailOptions, EmailService } from '../types'
import { TemplateService } from './template'

export class AzureEmailService implements EmailService {
  private client: EmailClient
  private templateService: TemplateService

  constructor() {
    const connectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING
    if (!connectionString) {
      throw new Error('AZURE_COMMUNICATION_CONNECTION_STRING ist nicht gesetzt')
    }
    this.client = new EmailClient(connectionString)
    this.templateService = TemplateService.getInstance()
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const htmlContent = await this.templateService.render(
        options.template,
        options.data
      )

      if (!process.env.SENDER_EMAIL_ADDRESS) {
        throw new Error('SENDER_EMAIL_ADDRESS ist nicht gesetzt')
      }

      const emailMessage = {
        senderAddress: process.env.SENDER_EMAIL_ADDRESS,
        content: {
          subject: options.subject,
          html: htmlContent,
          plainText: this.convertHtmlToPlainText(htmlContent),
        },
        recipients: {
          to: options.to,
        },
      }

      const poller = await this.client.beginSend(emailMessage)
      await poller.pollUntilDone()
    } catch (error) {
      console.error('Fehler beim Senden der E-Mail:', error)
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
