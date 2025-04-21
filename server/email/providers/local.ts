import { BaseEmailProvider } from './base'
import type { EmailMessage } from '~/types/email.types'

/**
 * Lokaler E-Mail-Provider für Entwicklungs- und Testzwecke
 * Gibt E-Mails nur in der Konsole aus
 */
export class LocalEmailProvider extends BaseEmailProvider {
  protected async sendEmailInternal(options: EmailMessage): Promise<void> {
    const sender = options.from || {
      address: 'local@btc-races.com',
      displayName: 'BTC Races (Local)',
    }

    console.log('=== Lokale E-Mail (nicht wirklich gesendet) ===')
    console.log('Von:', `${sender.displayName} <${sender.address}>`)
    console.log(
      'An:',
      options.to.map((r) => `${r.displayName || ''} <${r.address}>`).join(', ')
    )
    if (options.cc?.length) {
      console.log(
        'CC:',
        options.cc
          .map((r) => `${r.displayName || ''} <${r.address}>`)
          .join(', ')
      )
    }
    if (options.bcc?.length) {
      console.log(
        'BCC:',
        options.bcc
          .map((r) => `${r.displayName || ''} <${r.address}>`)
          .join(', ')
      )
    }
    console.log('Betreff:', options.subject)
    console.log('Inhalt:', options.content)
    if (options.attachments?.length) {
      console.log(
        'Anhänge:',
        options.attachments.map((a) => a.filename).join(', ')
      )
    }
    console.log('=============================================')
  }
}
