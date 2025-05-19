import { emailConfig } from '../config'
import type { RegistrationWithDetailsView } from '~/types/models.types'
import template from 'art-template'

/**
 * Interface für allgemeine Template-Daten
 */
export interface TemplateData {
  [key: string]: any
}

/**
 * Interface für Art-Template Funktionen
 */
interface ArtTemplateRenderFunction {
  (data: TemplateData): string
}

/**
 * Service für das Rendern von Templates und die Aufbereitung von Template-Daten
 */
export class TemplateService {
  // Templates als Konstanten definiert
  private readonly baseLayoutTemplate = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset='UTF-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        <title>{{ title }}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            padding: 0;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .header {
            background-color: #ffb700;
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: bold;
          }
          .content {
            padding: 30px;
            background-color: #ffffff;
          }
          .content p {
            margin: 0 0 15px 0;
          }
          .button {
            display: inline-block;
            background-color: #ffb700;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
            text-align: center;
          }
          .button:hover {
            background-color: #e6a500;
          }
          .url {
            word-break: break-all;
            background-color: #f9f9f9;
            padding: 10px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 0.9em;
          }
          .footer {
            text-align: center;
            font-size: 0.9em;
            color: #666;
            padding: 20px;
            border-top: 1px solid #eee;
            background-color: #f9f9f9;
            border-radius: 0 0 8px 8px;
          }
          .footer p {
            margin: 5px 0;
          }
          .footer .disclaimer {
            font-size: 0.9em;
            color: #999;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header" style="background-color: {{ headerColor || '#ffb700' }}; color: white; padding: 20px; text-align: center; margin-bottom: 20px;">
            <h1>{{ headerTitle }}</h1>
          </div>

          <div class="content">
            {{@ content }}

            <p style="margin-top: 30px;">Liebe Grüße,<br />Dein BTC</p>
          </div>
          

          <div class="footer">
            <p class="disclaimer">Diese E-Mail wurde automatisch generiert. Bitte antworte nicht direkt auf diese Nachricht.</p>
            <p class="disclaimer">&copy; {{ currentYear }} BTC-Races</p>
          </div>
        </div>
      </body>
    </html>
  `

  private readonly registrationConfirmationTemplate = `
    <p>Hallo {{ firstName }},</p>
    
    <p>vielen Dank für deine Anmeldung zum Wettkampf <strong>{{ competitionName }}</strong> am {{ competitionDate }}.</p>
    
    <p>Um deine Anmeldung zu bestätigen, klicke bitte auf den folgenden Link:</p>
    
    <a href="{{ confirmationLink }}" class="button">Anmeldung bestätigen</a>
    
    <p>Oder kopiere diese URL in deinen Browser:</p>
    <p class="url">{{ confirmationLink }}</p>
    
    <p>Dieser Link ist gültig bis zum {{ expiryDate }}.</p>
    
    <p>Falls du dich nicht zu diesem Wettkampf angemeldet hast, kannst du diese E-Mail ignorieren.</p>
    
    <p>Bei Fragen stehen wir dir gerne zur Verfügung.</p>
  `

  private readonly registrationCancellationTemplate = `
    <p>Hallo {{ firstName }},</p>
    
    <p>wir haben deine Anfrage erhalten, dich vom Wettkampf <strong>{{ competitionName }}</strong> am {{ competitionDate }} abzumelden.</p>
    
    <p>Um deine Abmeldung zu bestätigen, klicke bitte auf den folgenden Link:</p>
    
    <a href="{{ cancellationLink }}" class="button">Abmeldung bestätigen</a>
    
    <p>Oder kopiere diese URL in deinen Browser:</p>
    <p class="url">{{ cancellationLink }}</p>
    
    <p>Dieser Link ist gültig bis zum {{ expiryDate }}.</p>
    
    <p>Falls du dich nicht abmelden möchtest, kannst du diese E-Mail ignorieren und bleibst für den Wettkampf angemeldet.</p>
    
    <p>Bei Fragen stehen wir dir gerne zur Verfügung.</p>
  `

  // Kompilierte Template-Funktionen
  private compiledTemplates: Map<string, ArtTemplateRenderFunction> = new Map()

  constructor() {
    this.registerTemplates()
  }

  /**
   * Registriert alle Templates für die spätere Verwendung
   */
  private registerTemplates() {
    // Kompiliere E-Mail-Templates
    this.compiledTemplates.set(
      'base',
      template.compile(this.baseLayoutTemplate)
    )
    this.compiledTemplates.set(
      'registration-confirmation',
      template.compile(this.registrationConfirmationTemplate)
    )
    this.compiledTemplates.set(
      'registration-cancellation',
      template.compile(this.registrationCancellationTemplate)
    )
  }

  /**
   * Rendert ein Template mit den gegebenen Daten
   */
  public async renderTemplate(
    templateName: string,
    data: TemplateData
  ): Promise<string> {
    if (!this.compiledTemplates.has(templateName)) {
      throw new Error(`Template "${templateName}" nicht gefunden`)
    }

    const renderTemplate = this.compiledTemplates.get(templateName)!

    // Erweitere die Daten um das aktuelle Jahr
    const enhancedData = {
      ...data,
      currentYear: new Date().getFullYear(),
    }

    // Wenn es ein E-Mail-Template ist, render es zuerst und dann in das Base-Layout einbetten
    if (templateName !== 'base') {
      const content = renderTemplate(enhancedData)
      const renderBase = this.compiledTemplates.get('base')!

      return renderBase({
        ...enhancedData,
        content,
        title: this.getTemplateTitle(templateName),
      })
    }

    // Andernfalls direkt rendern (z.B. für Tests oder individuelle Templates)
    return renderTemplate(enhancedData)
  }

  /**
   * Ermittelt den Titel für ein Template
   */
  private getTemplateTitle(templateName: string): string {
    const titles: Record<string, string> = {
      'registration-confirmation': 'Anmeldebestätigung',
      'registration-cancellation': 'Abmeldebestätigung',
    }

    return titles[templateName] || 'BTC-Races'
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
      headerTitle: 'Anmeldebestätigung',
      headerColor: '#ffb700',
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
      headerTitle: 'Abmeldebestätigung',
      headerColor: '#ffb700',
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
      headerTitle: 'Wettkampf-Erinnerung',
      headerColor: '#ffb700',
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
