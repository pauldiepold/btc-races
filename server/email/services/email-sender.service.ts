import { EmailManager } from '../manager'
import type { EmailRecipient, EmailTemplate } from '~/types/email.types'
import type { TemplateData } from './template.service'

/**
 * Interface für die Optionen beim E-Mail-Versand
 */
export interface EmailOptions {
  recipients: EmailRecipient[]
  subject: string
  templateName: string
  templateData: TemplateData
  cc?: EmailRecipient[]
  bcc?: EmailRecipient[]
}

/**
 * Service für den Versand von E-Mails
 */
export class EmailSenderService {
  private emailManager: EmailManager

  constructor() {
    this.emailManager = new EmailManager()
  }

  /**
   * Sendet eine E-Mail mit den angegebenen Optionen
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    const template: EmailTemplate = {
      name: options.templateName,
      data: options.templateData,
    }

    await this.emailManager.sendEmail({
      to: options.recipients,
      cc: options.cc,
      bcc: options.bcc,
      subject: options.subject,
      content: '', // Wird durch das Template erzeugt
      template,
    })
  }
}
