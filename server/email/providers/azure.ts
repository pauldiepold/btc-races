import { EmailClient } from '@azure/communication-email'
import type { EmailMessage } from '~/types/email.types'
import { BaseEmailProvider } from './base'
import { emailConfig } from '../config'

/**
 * E-Mail-Provider-Implementierung, die Azure Communication Services verwendet
 */
export class AzureEmailProvider extends BaseEmailProvider {
  private client: EmailClient

  constructor() {
    super()
    if (!emailConfig.azureConnectionString) {
      throw new Error('Azure Connection String ist nicht konfiguriert')
    }
    this.client = new EmailClient(emailConfig.azureConnectionString)
  }

  protected async sendEmailInternal(options: EmailMessage): Promise<void> {
    const sender = options.from || {
      address: emailConfig.senderAddress!,
      displayName: 'BTC Races',
    }

    await this.client.beginSend({
      senderAddress: sender.address,
      content: {
        subject: options.subject,
        html: options.content,
        plainText: this.convertHtmlToPlainText(options.content),
      },
      recipients: {
        to: options.to.map((recipient) => ({
          address: recipient.address,
          displayName: recipient.displayName,
        })),
        cc: options.cc?.map((recipient) => ({
          address: recipient.address,
          displayName: recipient.displayName,
        })),
        bcc: options.bcc?.map((recipient) => ({
          address: recipient.address,
          displayName: recipient.displayName,
        })),
      },
      attachments: options.attachments?.map((attachment) => ({
        name: attachment.filename,
        contentInBase64: attachment.content.toString('base64'),
        contentType: attachment.contentType,
      })),
    })
  }
}
