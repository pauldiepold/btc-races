import type { EmailMessage, EmailProvider } from '#shared/types/email'

/**
 * Basisklasse für alle E-Mail-Provider
 */
export abstract class BaseEmailProvider implements EmailProvider {
  /**
   * Sendet eine E-Mail
   */
  async sendEmail(message: EmailMessage): Promise<void> {
    await this.sendEmailInternal(message)
  }

  /**
   * Abstrakte Methode, die von konkreten Providern implementiert werden muss
   */
  protected abstract sendEmailInternal(message: EmailMessage): Promise<void>
}
