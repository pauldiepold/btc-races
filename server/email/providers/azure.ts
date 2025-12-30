/*
Funktioniert nicht auf Cloudflare. Das Azure Package basiert auf node Funktionen, die nicht verfügbar sind.

import { EmailClient } from '@azure/communication-email'
import type { EmailMessage } from '~~/server/email/email.types'
import { BaseEmailProvider } from './base'

/!**
 * E-Mail-Provider-Implementierung, die Azure Communication Services verwendet
 *!/
export class AzureEmailProvider extends BaseEmailProvider {
  private client: EmailClient
  private senderAddress: string

  constructor(connectionString: string, senderAddress: string) {
    super()
    if (!connectionString) {
      throw new Error('Azure Connection String ist nicht konfiguriert')
    }
    if (!senderAddress) {
      throw new Error('Sender Email Address ist nicht konfiguriert')
    }
    this.client = new EmailClient(
      connectionString,
      { proxyOptions: undefined },
    )
    this.senderAddress = senderAddress
  }

  protected async sendEmailInternal(emailMessage: EmailMessage): Promise<void> {
    const sender = emailMessage.from || {
      address: this.senderAddress,
      displayName: 'BTC Races',
    }

    await this.client.beginSend({
      senderAddress: sender.address,
      content: {
        subject: emailMessage.subject,
        html: emailMessage.html,
        plainText: emailMessage.text,
      },
      recipients: {
        to: emailMessage.to.map(recipient => ({
          address: recipient.address,
          displayName: recipient.displayName,
        })),
        cc: emailMessage.cc?.map(recipient => ({
          address: recipient.address,
          displayName: recipient.displayName,
        })),
        bcc: emailMessage.bcc?.map(recipient => ({
          address: recipient.address,
          displayName: recipient.displayName,
        })),
      },
      attachments: emailMessage.attachments?.map(attachment => ({
        name: attachment.filename,
        contentInBase64: attachment.content.toString('base64'),
        contentType: attachment.contentType,
      })),
    })
  }
}
*/
