import fs from 'fs'
import path from 'path'
import type { EmailOptions, EmailService } from '../types'
import { TemplateService } from '../services/template'

/**
 * Lokaler E-Mail-Service für Entwicklungs- und Testzwecke
 * Speichert E-Mails als Dateien auf der Festplatte statt sie zu versenden
 */
export class LocalEmailService implements EmailService {
  private templateService: TemplateService
  private outputDir: string

  constructor() {
    this.templateService = TemplateService.getInstance()

    // Ausgabeverzeichnis für die lokalen E-Mails
    this.outputDir = path.join(process.cwd(), 'local-emails')

    // Stelle sicher, dass das Verzeichnis existiert
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true })
    }

    console.log(
      `[LocalEmailService] E-Mails werden gespeichert in: ${this.outputDir}`
    )
  }

  /**
   * "Sendet" eine E-Mail, indem sie als Datei gespeichert wird
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      // Render Template mit den bereitgestellten Daten
      const htmlContent = await this.templateService.render(options.template, {
        ...options.data,
        // Aktuelles Jahr für Copyright-Hinweise hinzufügen
        currentYear: new Date().getFullYear(),
      })

      // Erstelle einen eindeutigen Dateinamen basierend auf Zeitstempel und Betreff
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `${timestamp}-${options.subject.replace(/[^a-z0-9]/gi, '_')}.html`
      const filepath = path.join(this.outputDir, filename)

      // Erstelle ein JSON-Objekt mit allen relevanten E-Mail-Daten
      const emailData = {
        to: options.to,
        subject: options.subject,
        html: htmlContent,
        plainText: this.convertHtmlToPlainText(htmlContent),
        sentAt: new Date().toISOString(),
        template: options.template,
        templateData: options.data,
      }

      // Speichere die E-Mail als JSON-Datei
      fs.writeFileSync(filepath, JSON.stringify(emailData, null, 2))

      // Speichere die gerenderte HTML-Version separat für einfachere Ansicht
      const htmlFilepath = filepath.replace('.html', '.rendered.html')
      fs.writeFileSync(htmlFilepath, htmlContent)

      console.log(`[LocalEmailService] E-Mail gespeichert unter: ${filepath}`)

      // Füge einen einfachen Plain-Text-Log hinzu
      const logFilePath = path.join(this.outputDir, 'email-log.txt')
      const logEntry = `[${new Date().toISOString()}] An: ${options.to.map((r) => r.address).join(', ')} | Betreff: ${options.subject} | Datei: ${filename}\n`

      fs.appendFileSync(logFilePath, logEntry)
    } catch (error) {
      console.error('Fehler beim Speichern der lokalen E-Mail:', error)
      throw error
    }
  }

  /**
   * Konvertiert HTML in Plain-Text für bessere Lesbarkeit
   */
  private convertHtmlToPlainText(html: string): string {
    // Einfache Konvertierung von HTML zu Plain Text
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\n\s*\n/g, '\n')
      .trim()
  }
}
