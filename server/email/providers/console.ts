import { BaseEmailProvider } from './base'
import type { EmailMessage } from '~~/server/email/email.types'

/**
 * Lokaler E-Mail-Provider für Entwicklungs- und Testzwecke
 * Gibt E-Mails nur in der Konsole aus
 */
export class LocalEmailProvider extends BaseEmailProvider {
  protected async sendEmailInternal(emailMessage: EmailMessage): Promise<void> {
    const sender = emailMessage.from || {
      address: 'local@btc-races.com',
      displayName: 'BTC Races (Local)',
    }

    console.log('=== Lokale E-Mail (nicht wirklich gesendet) ===')
    console.log('Von:', `${sender.displayName} <${sender.address}>`)
    console.log(
      'An:',
      emailMessage.to
        .map(r => `${r.displayName || ''} <${r.address}>`)
        .join(', '),
    )
    if (emailMessage.cc?.length) {
      console.log(
        'CC:',
        emailMessage.cc
          .map(r => `${r.displayName || ''} <${r.address}>`)
          .join(', '),
      )
    }
    if (emailMessage.bcc?.length) {
      console.log(
        'BCC:',
        emailMessage.bcc
          .map(r => `${r.displayName || ''} <${r.address}>`)
          .join(', '),
      )
    }
    console.log('Betreff:', emailMessage.subject)
    // console.log('HTML:', emailMessage.html.substring(0, 200) + '...')
    console.log('Text:', emailMessage.text) // .substring(0, 200) + '...')
    if (emailMessage.attachments?.length) {
      console.log(
        'Anhänge:',
        emailMessage.attachments.map(a => a.filename).join(', '),
      )
    }
    console.log('=============================================')
  }
}
