import type { EmailMessage, EmailProvider } from '~/types/email.types'

/**
 * Basisklasse für alle E-Mail-Provider
 */
export abstract class BaseEmailProvider implements EmailProvider {
  /**
   * Sendet eine E-Mail
   */
  async sendEmail(message: EmailMessage): Promise<void> {
    // Rufe die spezifische Implementierung des Providers auf
    await this.sendEmailInternal(message)
  }

  /**
   * Abstrakte Methode, die von konkreten Providern implementiert werden muss
   */
  protected abstract sendEmailInternal(message: EmailMessage): Promise<void>

  /**
   * Konvertiert HTML in Plain-Text für bessere Lesbarkeit
   */
  public convertHtmlToPlainText(html: string): string {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\n\s*\n/g, '\n')
      .trim()
  }
}
