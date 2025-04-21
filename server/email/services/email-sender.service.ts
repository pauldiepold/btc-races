import { EmailManager } from '../manager'
import type { EmailMessage, EmailRecipient } from '~/types/email.types'
import { TemplateService, type TemplateData } from './template.service'

/**
 * Erweiterte Optionen für den E-Mail-Versand mit Template-Informationen
 */
export interface EmailWithTemplateOptions {
  to: EmailRecipient[]
  subject: string
  templateName: string
  templateData: TemplateData
  cc?: EmailRecipient[]
  bcc?: EmailRecipient[]
  from?: EmailRecipient
  rawContent?: string
  attachments?: EmailMessage['attachments']
}

/**
 * Service für den Versand von E-Mails
 */
export class EmailSenderService {
  private emailManager: EmailManager
  private templateService: TemplateService

  constructor() {
    this.emailManager = new EmailManager()
    this.templateService = new TemplateService()
  }

  /**
   * Sendet eine E-Mail mit Template-Verarbeitung
   */
  async sendEmailWithTemplate(
    options: EmailWithTemplateOptions
  ): Promise<void> {
    // Rendere das Template mit dem TemplateService
    const content = await this.templateService.renderTemplate(
      options.templateName,
      options.templateData,
      options.rawContent
    )

    // Sende die E-Mail mit dem gerenderten Inhalt
    await this.sendEmail({
      to: options.to,
      cc: options.cc,
      bcc: options.bcc,
      from: options.from,
      subject: options.subject,
      content,
      attachments: options.attachments,
    })
  }

  /**
   * Sendet eine vorbereitete E-Mail ohne Template-Verarbeitung
   */
  async sendEmail(message: EmailMessage): Promise<void> {
    await this.emailManager.sendEmail(message)
  }
}
