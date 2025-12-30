import { Buffer } from 'node:buffer'
import { EmailClient } from '@azure/communication-email'
import type { EmailMessage } from '~~/server/email/email.types'
import { BaseEmailProvider } from './base'

// Globale Umgebungsvorbereitung für Cloudflare Workers
if (typeof globalThis !== 'undefined') {
  if (!globalThis.Buffer) {
    (globalThis as any).Buffer = Buffer
  }
  // Azure SDK prüft oft nach process
  if (!globalThis.process) {
    (globalThis as any).process = { env: {} }
  }
}

/**
 * E-Mail-Provider-Implementierung, die Azure Communication Services verwendet
 */
export class AzureEmailProvider extends BaseEmailProvider {
  private connectionString: string
  private senderAddress: string

  constructor(connectionString: string, senderAddress: string) {
    super()
    if (!connectionString) {
      throw new Error('Azure Connection String ist nicht konfiguriert')
    }
    if (!senderAddress) {
      throw new Error('Sender Email Address ist nicht konfiguriert')
    }

    // WICHTIG: Client nicht mehr hier instanziieren!
    this.connectionString = connectionString
    this.senderAddress = senderAddress

    // Debug-Ausgabe (kannst du später entfernen)
    console.log('Azure Provider initialized - Environment:', {
      hasBuffer: typeof Buffer !== 'undefined',
      hasProcess: typeof process !== 'undefined',
      hasGlobal: typeof global !== 'undefined',
      hasGlobalThis: typeof globalThis !== 'undefined',
      runtime: typeof EdgeRuntime !== 'undefined' ? 'Edge' : 'Node',
    })
  }

  protected async sendEmailInternal(emailMessage: EmailMessage): Promise<void> {
    // Client ERST HIER erstellen - Lazy Instantiation!
    console.log('Creating EmailClient...')
    const client = new EmailClient(this.connectionString, {
      proxyOptions: undefined,
      retryOptions: {
        maxRetries: 3,
      },
    })
    console.log('EmailClient created successfully')

    const sender = emailMessage.from || {
      address: this.senderAddress,
      displayName: 'BTC Races',
    }

    try {
      const poller = await client.beginSend({
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
          contentInBase64: this.bufferToBase64(attachment.content),
          contentType: attachment.contentType,
        })),
      })

      console.log('Email send initiated, waiting for completion...')
      await poller.pollUntilDone()
      console.log('Email sent successfully')
    }
    catch (error) {
      console.error('Error sending email:', error)
      throw error
    }
  }

  /**
   * Sichere Buffer-zu-Base64-Konvertierung für Cloudflare
   */
  private bufferToBase64(content: Buffer | Uint8Array | string): string {
    if (typeof content === 'string') {
      return content
    }
    if (content instanceof Uint8Array) {
      return Buffer.from(content).toString('base64')
    }
    return content.toString('base64')
  }
}
