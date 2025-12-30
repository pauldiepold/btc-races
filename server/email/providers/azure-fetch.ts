// server/email/providers/azure-fetch.provider.ts
import type { EmailMessage } from '~~/server/email/email.types'
import { BaseEmailProvider } from './base'

interface AzureConnectionStringParts {
  endpoint: string
  accessKey: string
}

/**
 * Azure Email Provider mit nativer Fetch API
 * Optimiert für Cloudflare Workers - kein Azure SDK nötig
 */
export class AzureFetchEmailProvider extends BaseEmailProvider {
  private endpoint: string
  private accessKey: string
  private senderAddress: string

  constructor(connectionString: string, senderAddress: string) {
    super()

    if (!connectionString) {
      throw new Error('Azure Connection String ist nicht konfiguriert')
    }
    if (!senderAddress) {
      throw new Error('Sender Email Address ist nicht konfiguriert')
    }

    const parts = this.parseConnectionString(connectionString)
    this.endpoint = parts.endpoint
    this.accessKey = parts.accessKey
    this.senderAddress = senderAddress

    /* console.log('Azure Fetch Provider initialized:', {
      endpoint: this.endpoint,
      senderAddress: this.senderAddress,
    }) */
  }

  /**
   * Parst den Azure Connection String
   */
  private parseConnectionString(connectionString: string): AzureConnectionStringParts {
    const parts: Record<string, string> = {}

    connectionString.split(';').forEach((part) => {
      const [key, ...valueParts] = part.split('=')
      if (key && valueParts.length) {
        parts[key.toLowerCase().trim()] = valueParts.join('=').trim()
      }
    })

    if (!parts.endpoint || !parts.accesskey) {
      throw new Error(
        'Invalid Azure Connection String. Expected format: endpoint=https://...;accesskey=...',
      )
    }

    return {
      endpoint: parts.endpoint.replace(/\/$/, ''),
      accessKey: parts.accesskey,
    }
  }

  /**
   * Erstellt die HMAC-SHA256 Signatur für Azure Authentication
   * Korrigiert für die strikten Azure REST Anforderungen
   */
  private async createAuthSignature(
    method: string,
    url: string,
    date: string,
    contentHash: string,
  ): Promise<string> {
    const urlParts = new URL(url)
    // WICHTIG: Azure erwartet nur den Path und die Query
    const pathAndQuery = urlParts.pathname + urlParts.search
    const host = urlParts.host // z.B. "dein-resource.communication.azure.com"

    // Azure StringToSign Spezifikation:
    // VERB + "\n" +
    // resourcePathAndQuery + "\n" +
    // x-ms-date + ";" + host + ";" + x-ms-content-sha256
    // Wichtig: Keine Leerzeichen nach den Semikolons!

    const stringToSign = `${method.toUpperCase()}\n${pathAndQuery}\n${date};${host};${contentHash}`

    const encoder = new TextEncoder()

    // Key von Base64 zu ArrayBuffer
    const keyData = this.base64ToArrayBuffer(this.accessKey)

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      encoder.encode(stringToSign),
    )

    const signatureBase64 = this.arrayBufferToBase64(signatureBuffer)

    // Das Format des Authorization Headers muss EXAKT so aussehen:
    return `HMAC-SHA256 SignedHeaders=x-ms-date;host;x-ms-content-sha256&Signature=${signatureBase64}`
  }

  /**
   * Berechnet SHA256 Hash des Request Body
   */
  private async computeContentHash(content: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(content)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    return this.arrayBufferToBase64(hashBuffer)
  }

  /**
   * Konvertiert Base64 String zu ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes.buffer
  }

  /**
   * Konvertiert ArrayBuffer zu Base64 String
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)))
  }

  protected async sendEmailInternal(emailMessage: EmailMessage): Promise<void> {
    const sender = emailMessage.from || {
      address: this.senderAddress,
      displayName: 'BTC Races',
    }

    // Azure Email API Payload
    const payload = {
      senderAddress: sender.address,
      content: {
        subject: emailMessage.subject,
        html: emailMessage.html,
        plainText: emailMessage.text,
      },
      recipients: {
        to: emailMessage.to.map(r => ({
          address: r.address,
          displayName: r.displayName,
        })),
        ...(emailMessage.cc && emailMessage.cc.length > 0 && {
          cc: emailMessage.cc.map(r => ({
            address: r.address,
            displayName: r.displayName,
          })),
        }),
        ...(emailMessage.bcc && emailMessage.bcc.length > 0 && {
          bcc: emailMessage.bcc.map(r => ({
            address: r.address,
            displayName: r.displayName,
          })),
        }),
      },
      ...(emailMessage.attachments && emailMessage.attachments.length > 0 && {
        attachments: emailMessage.attachments.map(a => ({
          name: a.filename,
          contentInBase64: this.bufferToBase64(a.content),
          contentType: a.contentType,
        })),
      }),
    }

    const apiVersion = '2023-03-31'
    const url = `${this.endpoint}/emails:send?api-version=${apiVersion}`
    const date = new Date().toUTCString()
    const bodyString = JSON.stringify(payload)
    const contentHash = await this.computeContentHash(bodyString)
    const authHeader = await this.createAuthSignature('POST', url, date, contentHash)

    // Eindeutige ID für Idempotenz
    const requestId = crypto.randomUUID()

    console.log('Sending email via Azure API:', {
      url,
      to: emailMessage.to.map(r => r.address),
      subject: emailMessage.subject,
      requestId,
    })

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-ms-date': date,
          'x-ms-content-sha256': contentHash,
          'Authorization': authHeader,
          'repeatability-request-id': requestId,
          'repeatability-first-sent': date,
        },
        body: bodyString,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Azure API Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        })
        throw new Error(
          `Azure Email API error: ${response.status} ${response.statusText} - ${errorText}`,
        )
      }

      // Azure gibt Operation Location für Status-Tracking zurück
      const operationLocation = response.headers.get('operation-location')
      const responseData = await response.json().catch(() => ({}))

      console.log('Email send initiated:', {
        operationLocation,
        messageId: responseData.id,
      })

      // Optional: Warte auf Completion (für kritische Emails)
      if (operationLocation) {
        await this.pollOperationStatus(operationLocation, date, requestId)
      }
    }
    catch (error) {
      console.error('Failed to send email:', error)
      throw error
    }
  }

  /**
   * Pollt den Status der Email-Operation
   */
  private async pollOperationStatus(
    operationUrl: string,
    date: string,
    _requestId: string,
  ): Promise<void> {
    const maxAttempts = 10
    const delayMs = 1000

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, delayMs))

      try {
        const contentHash = await this.computeContentHash('')
        const authHeader = await this.createAuthSignature('GET', operationUrl, date, contentHash)

        const response = await fetch(operationUrl, {
          method: 'GET',
          headers: {
            'x-ms-date': date,
            'x-ms-content-sha256': contentHash,
            'Authorization': authHeader,
          },
        })

        if (!response.ok) {
          console.warn(`Status check attempt ${i + 1} failed:`, response.status)
          continue
        }

        const result = await response.json()

        console.log(`Email status (attempt ${i + 1}):`, result.status)

        if (result.status === 'Succeeded') {
          console.log('Email sent successfully')
          return
        }

        if (result.status === 'Failed') {
          console.error('Email sending failed:', result.error)
          throw new Error(`Email sending failed: ${JSON.stringify(result.error)}`)
        }

        // Status ist noch "Running" oder "NotStarted"
      }
      catch (error) {
        if (i === maxAttempts - 1) {
          throw error
        }
        console.warn(`Status check attempt ${i + 1} error:`, error)
      }
    }

    // Timeout ist nicht kritisch - Email wurde bereits akzeptiert
    console.warn('Status polling timeout - email was accepted but final status unknown')
  }

  /**
   * Sichere Buffer-zu-Base64-Konvertierung
   */
  private bufferToBase64(content: Buffer | Uint8Array | string): string {
    if (typeof content === 'string') {
      return content
    }
    if (content instanceof Uint8Array) {
      return Buffer.from(content).toString('base64')
    }
    // TypeScript Type Guard für Buffer
    if (content && typeof content === 'object' && 'toString' in content) {
      return (content as Buffer).toString('base64')
    }
    // Fallback für unbekannte Typen
    throw new Error(`Unsupported attachment content type: ${typeof content}`)
  }
}
