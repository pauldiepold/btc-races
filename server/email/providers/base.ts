import type { EmailMessage, EmailProvider } from '~/types/email.types'
import Handlebars from 'handlebars'
import fs from 'fs'
import path from 'path'

/**
 * Basisklasse für alle E-Mail-Provider mit integrierter Template-Verarbeitung
 */
export abstract class BaseEmailProvider implements EmailProvider {
  private templates: Map<string, Handlebars.TemplateDelegate> = new Map()

  constructor() {
    this.registerPartials()
    this.registerLayouts()
  }

  /**
   * Registriert alle Partials aus dem Partials-Verzeichnis
   */
  private registerPartials() {
    const partialsDir = path.join(
      process.cwd(),
      'server/email/templates/partials'
    )
    const files = fs.readdirSync(partialsDir)

    files.forEach((file) => {
      if (file.endsWith('.hbs')) {
        const name = path.basename(file, '.hbs')
        const template = fs.readFileSync(path.join(partialsDir, file), 'utf8')
        Handlebars.registerPartial(name, template)
      }
    })
  }

  /**
   * Registriert alle Layouts aus dem Layouts-Verzeichnis
   */
  private registerLayouts() {
    const layoutsDir = path.join(
      process.cwd(),
      'server/email/templates/layouts'
    )
    const files = fs.readdirSync(layoutsDir)

    files.forEach((file) => {
      if (file.endsWith('.hbs')) {
        const name = path.basename(file, '.hbs')
        const template = fs.readFileSync(path.join(layoutsDir, file), 'utf8')
        Handlebars.registerPartial(name, template)
      }
    })
  }

  /**
   * Lädt und kompiliert ein Template
   */
  private async getTemplate(
    templateName: string
  ): Promise<Handlebars.TemplateDelegate> {
    if (this.templates.has(templateName)) {
      return this.templates.get(templateName)!
    }

    const templatePath = path.join(
      process.cwd(),
      'server/email/templates/emails',
      `${templateName}.hbs`
    )
    const template = fs.readFileSync(templatePath, 'utf8')
    const compiledTemplate = Handlebars.compile(template)

    this.templates.set(templateName, compiledTemplate)
    return compiledTemplate
  }

  /**
   * Rendert ein Template mit den gegebenen Daten
   */
  protected async renderTemplate(
    templateName: string,
    data: any
  ): Promise<string> {
    const template = await this.getTemplate(templateName)
    return template(data)
  }

  /**
   * Sendet eine E-Mail mit optionalem Template
   */
  async sendEmail(message: EmailMessage): Promise<void> {
    let content = message.content

    // Wenn ein Template angegeben ist, rendere es
    if (message.template) {
      content = await this.renderTemplate(message.template.name, {
        ...message.template.data,
        content: message.content, // Originaler Content als Fallback
      })
    }

    // Rufe die spezifische Implementierung des Providers auf
    await this.sendEmailInternal({
      ...message,
      content,
    })
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
