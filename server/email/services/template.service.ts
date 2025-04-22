import { emailConfig } from '../config'
import type { RegistrationWithDetailsView } from '~/types/models.types'
import Handlebars from 'handlebars'
import fs from 'fs'
import path from 'path'

/**
 * Interface für allgemeine Template-Daten
 */
export interface TemplateData {
  [key: string]: any
}

/**
 * Service für das Rendern von Templates und die Aufbereitung von Template-Daten
 */
export class TemplateService {
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
  public async renderTemplate(
    templateName: string,
    data: TemplateData,
    content?: string
  ): Promise<string> {
    const template = await this.getTemplate(templateName)
    return template({
      ...data,
      content: content || '', // Originaler Content als Fallback
    })
  }

  /**
   * Bereitet Daten für ein Anmeldebestätigungs-Template vor
   */
  prepareRegistrationConfirmationData(
    registration: RegistrationWithDetailsView,
    token: string,
    expiryDate: Date
  ): TemplateData {
    return {
      firstName: this.extractFirstName(registration.member_name),
      competitionName: registration.competition_name,
      competitionDate: this.formatDate(registration.competition_date),
      confirmationLink: this.buildLink('/registrations/confirm', token),
      expiryDate: this.formatDate(expiryDate.toISOString()),
    }
  }

  /**
   * Bereitet Daten für ein Abmeldebestätigungs-Template vor
   */
  prepareRegistrationCancellationData(
    registration: RegistrationWithDetailsView,
    token: string,
    expiryDate: Date
  ): TemplateData {
    return {
      firstName: this.extractFirstName(registration.member_name),
      competitionName: registration.competition_name,
      competitionDate: this.formatDate(registration.competition_date),
      cancellationLink: this.buildLink('/registrations/cancel', token),
      expiryDate: this.formatDate(expiryDate.toISOString()),
    }
  }

  /**
   * Bereitet Daten für eine Wettkampf-Erinnerungs-E-Mail vor
   */
  prepareCompetitionReminderData(
    registration: RegistrationWithDetailsView
  ): TemplateData {
    return {
      firstName: this.extractFirstName(registration.member_name),
      competitionName: registration.competition_name,
      competitionDate: this.formatDate(registration.competition_date),
      competitionLocation:
        registration.competition_location || 'nicht angegeben',
    }
  }

  /**
   * Hilfsmethode: Extrahiert den Vornamen aus einem vollständigen Namen
   */
  private extractFirstName(fullName: string | null): string {
    if (!fullName) return ''
    return fullName.split(' ')[0]
  }

  /**
   * Hilfsmethode: Formatiert ein Datum in deutsches Format
   */
  private formatDate(dateString: string | null): string {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('de-DE')
  }

  /**
   * Hilfsmethode: Erstellt einen Link mit Token
   */
  private buildLink(path: string, token: string): string {
    return `${emailConfig.publicUrl}${path}?token=${token}`
  }
}
