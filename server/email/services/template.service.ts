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

    <p>Du hast Dich zum Wettkampf <strong>{{ competitionName }}</strong> am {{ competitionDate }} angemeldet.</p>

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

  // Geteiltes Template für Wettkampfdetails
  private readonly competitionDetailsTemplate = `
    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
      <h3 style="margin: 0 0 10px 0; color: #333;">Wettkampfdetails:</h3>
      <p style="margin: 5px 0;"><strong>Name:</strong> {{ competitionName }}</p>
      <p style="margin: 5px 0;"><strong>Datum:</strong> {{ competitionDate }}</p>
      <p style="margin: 5px 0;"><strong>Meldefrist:</strong> {{ registrationDeadline }}</p>
      <p style="margin: 5px 0;"><strong>Ort:</strong> {{ competitionLocation }}</p>
      {{ if competitionVenue }}
      <p style="margin: 5px 0;"><strong>Sportstätte:</strong> {{ competitionVenue }}</p>
      {{ /if }}
    </div>
  `

  // Neue Templates für LADV-Meldungen und Coach-Benachrichtigungen
  private readonly ladvRegistrationByCoachTemplate = `
    <p>Hallo {{ firstName }},</p>

    <p>{{ coachName }} hat dich für den folgenden Wettkampf angemeldet:</p>

    {{@ competitionDetails }}

    <p>Du kannst dich auf der Wettkampfseite selbst wieder abmelden, falls gewünscht. Der Coach nimmt dann die Meldung in LADV zurück.</p>

    <a href="{{ competitionLink }}" class="button">Zum Wettkampf</a>

    <p>Oder kopiere diese URL in deinen Browser:</p>
    <p class="url">{{ competitionLink }}</p>
  `

  private readonly ladvCancellationByCoachTemplate = `
    <p>Hallo {{ firstName }},</p>

    <p>{{ coachName }} hat deine Meldung für den folgenden Wettkampf in LADV zurückgenommen:</p>

    {{@ competitionDetails }}

    <p>Falls du doch teilnehmen möchtest, wende dich bitte an {{ coachName }}.</p>

    <a href="{{ competitionLink }}" class="button">Zum Wettkampf</a>

    <p>Oder kopiere diese URL in deinen Browser:</p>
    <p class="url">{{ competitionLink }}</p>
  `

  private readonly coachUrgentRegistrationNotificationTemplate = `
    <p>Hallo liebe Coaches,</p>

    <p>{{ memberName }} hat sich kurzfristig zum folgenden Wettkampf angemeldet:</p>

    {{@ competitionDetails }}

    <p><strong>Bitte prüft:</strong> Kann diese Anmeldung noch rechtzeitig in LADV eingetragen werden?</p>

    <a href="{{ competitionLink }}" class="button">Zum Wettkampf</a>

    <p>Oder kopiere diese URL in deinen Browser:</p>
    <p class="url">{{ competitionLink }}</p>
  `

  private readonly registrationConfirmationDetailsTemplate = `
    <p>Hallo {{ firstName }},</p>

    <p>deine Anmeldung zum folgenden Wettkampf wurde erfolgreich bestätigt:</p>

    {{@ competitionDetails }}

    <p><strong>Wichtige Hinweise:</strong></p>
    <ul>
      <li>Sobald unsere Coaches dich bei LADV gemeldet haben, wirst du eine weitere E-Mail erhalten.</li>
      <li>Eine Abmeldung ist bis zur Meldefrist ({{ registrationDeadline }}) möglich</li>
      <li>Danach sind keine Änderungen mehr möglich</li>
    </ul>

    <a href="{{ competitionLink }}" class="button">Zum Wettkampf</a>

    <p>Oder kopiere diese URL in deinen Browser:</p>
    <p class="url">{{ competitionLink }}</p>
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
    // Neues Teil-Template für Wettkampfdetails
    this.compiledTemplates.set(
      'competition-details',
      template.compile(this.competitionDetailsTemplate)
    )
    // Neue LADV und Coach-Templates
    this.compiledTemplates.set(
      'ladv-registration-by-coach',
      template.compile(this.ladvRegistrationByCoachTemplate)
    )
    this.compiledTemplates.set(
      'ladv-cancellation-by-coach',
      template.compile(this.ladvCancellationByCoachTemplate)
    )
    this.compiledTemplates.set(
      'coach-urgent-registration-notification',
      template.compile(this.coachUrgentRegistrationNotificationTemplate)
    )
    this.compiledTemplates.set(
      'registration-confirmation-details',
      template.compile(this.registrationConfirmationDetailsTemplate)
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

    // Spezielle Behandlung für Templates mit competition-details
    if (
      data.competitionDetails ||
      [
        'ladv-registration-by-coach',
        'ladv-cancellation-by-coach',
        'coach-urgent-registration-notification',
        'registration-confirmation-details',
      ].includes(templateName)
    ) {
      ;(enhancedData as any).competitionDetails =
        await this.renderCompetitionDetails(data)
    }

    // Wenn es ein E-Mail-Template ist, render es zuerst und dann in das Base-Layout einbetten
    if (templateName !== 'base' && templateName !== 'competition-details') {
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
   * Rendert das Competition-Details Teil-Template
   */
  private async renderCompetitionDetails(data: TemplateData): Promise<string> {
    const renderCompetitionDetails = this.compiledTemplates.get(
      'competition-details'
    )!
    return renderCompetitionDetails(data)
  }

  /**
   * Ermittelt den Titel für ein Template
   */
  private getTemplateTitle(templateName: string): string {
    const titles: Record<string, string> = {
      'registration-confirmation': 'Anmeldebestätigung',
      'registration-cancellation': 'Abmeldebestätigung',
      'ladv-registration-by-coach': 'LADV-Anmeldung durch Coach',
      'ladv-cancellation-by-coach': 'LADV-Abmeldung durch Coach',
      'coach-urgent-registration-notification': 'Dringende Anmeldung',
      'registration-confirmation-details': 'Bestätigungsdetails',
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
      registrationDeadline: this.formatDate(registration.registration_deadline),
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
      registrationDeadline: this.formatDate(registration.registration_deadline),
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
      registrationDeadline: this.formatDate(registration.registration_deadline),
      competitionLocation:
        registration.competition_location || 'nicht angegeben',
      headerTitle: 'Wettkampf-Erinnerung',
      headerColor: '#ffb700',
    }
  }

  /**
   * Bereitet Daten für LADV-Anmeldung durch Coach vor
   */
  prepareLadvRegistrationByCoachData(
    registration: RegistrationWithDetailsView
  ): TemplateData {
    return {
      firstName: this.extractFirstName(registration.member_name),
      coachName: registration.ladv_registered_by || 'ein Coach',
      competitionName: registration.competition_name,
      competitionDate: this.formatDate(registration.competition_date),
      registrationDeadline: this.formatDate(registration.registration_deadline),
      competitionLocation:
        registration.competition_location || 'nicht angegeben',
      competitionVenue: registration.sportstaette || undefined,
      competitionLink: this.buildCompetitionLink(
        registration.competition_id?.toString() || ''
      ),
      headerTitle: 'LADV-Anmeldung',
      headerColor: '#007acc',
    }
  }

  /**
   * Bereitet Daten für LADV-Abmeldung durch Coach vor
   */
  prepareLadvCancellationByCoachData(
    registration: RegistrationWithDetailsView
  ): TemplateData {
    return {
      firstName: this.extractFirstName(registration.member_name),
      coachName: registration.ladv_canceled_by || 'ein Coach',
      competitionName: registration.competition_name,
      competitionDate: this.formatDate(registration.competition_date),
      registrationDeadline: this.formatDate(registration.registration_deadline),
      competitionLocation:
        registration.competition_location || 'nicht angegeben',
      competitionVenue: registration.sportstaette || undefined,
      competitionLink: this.buildCompetitionLink(
        registration.competition_id?.toString() || ''
      ),
      headerTitle: 'LADV-Abmeldung',
      headerColor: '#007acc',
    }
  }

  /**
   * Bereitet Daten für Coach-Benachrichtigung bei dringender Anmeldung vor
   */
  prepareCoachUrgentRegistrationNotificationData(
    registration: RegistrationWithDetailsView
  ): TemplateData {
    return {
      memberName: registration.member_name,
      competitionName: registration.competition_name,
      competitionDate: this.formatDate(registration.competition_date),
      registrationDeadline: this.formatDate(registration.registration_deadline),
      competitionLocation:
        registration.competition_location || 'nicht angegeben',
      competitionVenue: registration.sportstaette || undefined,
      competitionLink: this.buildCompetitionLink(
        registration.competition_id?.toString() || ''
      ),
      headerTitle: 'Dringende Anmeldung',
      headerColor: '#ff8c00',
    }
  }

  /**
   * Bereitet Daten für Anmeldebestätigung mit Details vor
   */
  prepareRegistrationConfirmationDetailsData(
    registration: RegistrationWithDetailsView
  ): TemplateData {
    return {
      firstName: this.extractFirstName(registration.member_name),
      competitionName: registration.competition_name,
      competitionDate: this.formatDate(registration.competition_date),
      competitionLocation:
        registration.competition_location || 'nicht angegeben',
      competitionVenue: registration.sportstaette || undefined,
      competitionLink: this.buildCompetitionLink(
        registration.competition_id?.toString() || ''
      ),
      registrationDeadline: this.formatDate(registration.registration_deadline),
      headerTitle: 'Bestätigungsdetails',
      headerColor: '#28a745',
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

  /**
   * Hilfsmethode: Erstellt einen Wettkampflink
   */
  private buildCompetitionLink(competitionId: string): string {
    return `${emailConfig.publicUrl}/competitions/${competitionId}`
  }
}
