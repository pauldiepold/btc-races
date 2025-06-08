import type { H3Event } from 'h3'
import { EmailTypes } from '~/types/enums'
import { TokenService } from './token.service'
import { TemplateService } from './template.service'
import { EmailSenderService } from './email-sender.service'
import { emailConfig } from '../config'
import type { SentEmailsRepository } from '~/server/repositories/sent-emails.repository'
import { createSentEmailsRepository } from '~/server/repositories/sent-emails.repository'
import type { RegistrationsRepository } from '~/server/repositories/registrations.repository'
import { createRegistrationsRepository } from '~/server/repositories/registrations.repository'

/**
 * Service für die Verwaltung und den Versand von verschiedenen Benachrichtigungs-E-Mails
 */
export class NotificationEmailService {
  private templateService: TemplateService
  private emailSenderService: EmailSenderService

  constructor(
    private readonly sentEmailsRepo: SentEmailsRepository,
    private readonly registrationsRepo: RegistrationsRepository,
    private readonly tokenService: TokenService
  ) {
    this.templateService = new TemplateService()
    this.emailSenderService = new EmailSenderService()
  }

  /**
   * Factory-Methode zum Erstellen des Services mit Repositories
   */
  static async create(event: H3Event): Promise<NotificationEmailService> {
    const sentEmailsRepo = await createSentEmailsRepository(
      event,
      'service_role'
    )
    const registrationsRepo = await createRegistrationsRepository(
      event,
      'service_role'
    )
    const tokenService = new TokenService(sentEmailsRepo)

    return new NotificationEmailService(
      sentEmailsRepo,
      registrationsRepo,
      tokenService
    )
  }

  /**
   * Sendet eine Anmeldebestätigungsmail für eine Registrierung
   */
  async sendRegistrationConfirmation(registrationId: number): Promise<void> {
    // 1. Lade Registrierungsdaten mit Repository
    const registration =
      await this.registrationsRepo.findWithDetails(registrationId)

    if (!registration) {
      throw new Error(`Registrierung mit ID ${registrationId} nicht gefunden`)
    }

    if (!registration.member_email) {
      throw new Error(
        `Mitglied (ID: ${registration.member_id}) hat keine E-Mail-Adresse`
      )
    }

    // 2. Generiere Token mit TokenService
    const token = this.tokenService.generateToken()
    const expiryDate = this.tokenService.getExpiryDate()

    // 3. Bereite Template-Daten mit TemplateService vor
    const templateData =
      this.templateService.prepareRegistrationConfirmationData(
        registration,
        token,
        expiryDate
      )

    // 4. Template rendern
    const renderedTemplate = await this.templateService.renderTemplate(
      'registration-confirmation',
      templateData
    )

    // 5. E-Mail senden mit EmailSenderService
    const subject = `Anmeldebestätigung für ${registration.competition_name}`

    await this.emailSenderService.sendEmail({
      to: [
        {
          address: registration.member_email!,
          displayName: registration.member_name!,
        },
      ],
      subject,
      content: renderedTemplate,
    })

    // 6. Protokolliere versendete E-Mail mit Repository
    await this.sentEmailsRepo.create({
      registration_id: registrationId,
      email_type: EmailTypes.REGISTRATION_CONFIRMATION,
      subject,
      token,
      token_expires_at: expiryDate.toISOString(),
      status: 'sent',
      sent_at: new Date().toISOString(),
    })
  }

  /**
   * Sendet eine Bestätigungsmail für die Abmeldung von einem Wettkampf
   */
  async sendRegistrationCancellation(registrationId: number): Promise<void> {
    // 1. Lade Registrierungsdaten mit Repository
    const registration =
      await this.registrationsRepo.findWithDetails(registrationId)

    if (!registration) {
      throw new Error(`Registrierung mit ID ${registrationId} nicht gefunden`)
    }

    if (!registration.member_email) {
      throw new Error(
        `Mitglied (ID: ${registration.member_id}) hat keine E-Mail-Adresse`
      )
    }

    // 2. Generiere Token mit TokenService
    const token = this.tokenService.generateToken()
    const expiryDate = this.tokenService.getExpiryDate()

    // 3. Bereite Template-Daten mit TemplateService vor
    const templateData =
      this.templateService.prepareRegistrationCancellationData(
        registration,
        token,
        expiryDate
      )

    // 4. Template rendern
    const renderedTemplate = await this.templateService.renderTemplate(
      'registration-cancellation',
      templateData
    )

    // 5. E-Mail senden mit EmailSenderService
    const subject = `Abmeldebestätigung für ${registration.competition_name}`

    await this.emailSenderService.sendEmail({
      to: [
        {
          address: registration.member_email!,
          displayName: registration.member_name!,
        },
      ],
      subject,
      content: renderedTemplate,
    })

    // 6. Protokolliere versendete E-Mail mit Repository
    await this.sentEmailsRepo.create({
      registration_id: registrationId,
      email_type: EmailTypes.REGISTRATION_CANCELLATION,
      subject,
      token,
      token_expires_at: expiryDate.toISOString(),
      status: 'sent',
      sent_at: new Date().toISOString(),
    })
  }

  /**
   * Sendet eine Benachrichtigung über LADV-Anmeldung durch Coach
   */
  async sendLadvRegistrationByCoach(registrationId: number): Promise<void> {
    const registration =
      await this.registrationsRepo.findWithDetails(registrationId)

    if (!registration) {
      throw new Error(`Registrierung mit ID ${registrationId} nicht gefunden`)
    }

    if (!registration.member_email) {
      throw new Error(
        `Mitglied (ID: ${registration.member_id}) hat keine E-Mail-Adresse`
      )
    }

    // Bereite Template-Daten vor
    const templateData =
      this.templateService.prepareLadvRegistrationByCoachData(registration)

    // Template rendern
    const renderedTemplate = await this.templateService.renderTemplate(
      'ladv-registration-by-coach',
      templateData
    )

    // E-Mail senden
    const subject = `LADV-Anmeldung: ${registration.competition_name}`

    await this.emailSenderService.sendEmail({
      to: [
        {
          address: registration.member_email!,
          displayName: registration.member_name!,
        },
      ],
      subject,
      content: renderedTemplate,
    })

    // Protokolliere versendete E-Mail
    await this.sentEmailsRepo.create({
      registration_id: registrationId,
      email_type: EmailTypes.LADV_REGISTRATION_BY_COACH,
      subject,
      status: 'sent',
      sent_at: new Date().toISOString(),
    })
  }

  /**
   * Sendet eine Benachrichtigung über LADV-Abmeldung durch Coach
   */
  async sendLadvCancellationByCoach(registrationId: number): Promise<void> {
    const registration =
      await this.registrationsRepo.findWithDetails(registrationId)

    if (!registration) {
      throw new Error(`Registrierung mit ID ${registrationId} nicht gefunden`)
    }

    if (!registration.member_email) {
      throw new Error(
        `Mitglied (ID: ${registration.member_id}) hat keine E-Mail-Adresse`
      )
    }

    // Bereite Template-Daten vor
    const templateData =
      this.templateService.prepareLadvCancellationByCoachData(registration)

    // Template rendern
    const renderedTemplate = await this.templateService.renderTemplate(
      'ladv-cancellation-by-coach',
      templateData
    )

    // E-Mail senden
    const subject = `LADV-Abmeldung: ${registration.competition_name}`

    await this.emailSenderService.sendEmail({
      to: [
        {
          address: registration.member_email!,
          displayName: registration.member_name!,
        },
      ],
      subject,
      content: renderedTemplate,
    })

    // Protokolliere versendete E-Mail
    await this.sentEmailsRepo.create({
      registration_id: registrationId,
      email_type: EmailTypes.LADV_CANCELLATION_BY_COACH,
      subject,
      status: 'sent',
      sent_at: new Date().toISOString(),
    })
  }

  /**
   * Sendet eine dringende Benachrichtigung an alle Coaches über eine kurzfristige Anmeldung
   */
  async sendCoachUrgentRegistrationNotification(
    registrationId: number
  ): Promise<void> {
    const registration =
      await this.registrationsRepo.findWithDetails(registrationId)

    if (!registration) {
      throw new Error(`Registrierung mit ID ${registrationId} nicht gefunden`)
    }

    if (emailConfig.coachEmails.length === 0) {
      console.warn(
        'Keine Coach-E-Mail-Adressen konfiguriert. E-Mail wird nicht gesendet.'
      )
      return
    }

    // Bereite Template-Daten vor
    const templateData =
      this.templateService.prepareCoachUrgentRegistrationNotificationData(
        registration
      )

    // Template rendern
    const renderedTemplate = await this.templateService.renderTemplate(
      'coach-urgent-registration-notification',
      templateData
    )

    // E-Mail senden an alle Coaches
    const subject = `Dringende Anmeldung: ${registration.member_name} - ${registration.competition_name}`

    console.log(
      emailConfig.coachEmails.map((email) => ({
        address: email,
        displayName: 'Coach',
      }))
    )

    await this.emailSenderService.sendEmail({
      to: emailConfig.coachEmails.map((email) => ({
        address: email,
        displayName: 'Coach',
      })),
      subject,
      content: renderedTemplate,
    })

    // Protokolliere versendete E-Mail
    await this.sentEmailsRepo.create({
      registration_id: registrationId,
      email_type: EmailTypes.COACH_URGENT_REGISTRATION_NOTIFICATION,
      subject,
      status: 'sent',
      sent_at: new Date().toISOString(),
    })
  }

  /**
   * Sendet detaillierte Bestätigungsinformationen nach einer Anmeldung
   */
  async sendRegistrationConfirmationDetails(
    registrationId: number
  ): Promise<void> {
    const registration =
      await this.registrationsRepo.findWithDetails(registrationId)

    if (!registration) {
      throw new Error(`Registrierung mit ID ${registrationId} nicht gefunden`)
    }

    if (!registration.member_email) {
      throw new Error(
        `Mitglied (ID: ${registration.member_id}) hat keine E-Mail-Adresse`
      )
    }

    // Bereite Template-Daten vor
    const templateData =
      this.templateService.prepareRegistrationConfirmationDetailsData(
        registration
      )

    // Template rendern
    const renderedTemplate = await this.templateService.renderTemplate(
      'registration-confirmation-details',
      templateData
    )

    // E-Mail senden
    const subject = `Bestätigungsdetails: ${registration.competition_name}`

    await this.emailSenderService.sendEmail({
      to: [
        {
          address: registration.member_email!,
          displayName: registration.member_name!,
        },
      ],
      subject,
      content: renderedTemplate,
    })

    // Protokolliere versendete E-Mail
    await this.sentEmailsRepo.create({
      registration_id: registrationId,
      email_type: EmailTypes.REGISTRATION_CONFIRMATION_DETAILS,
      subject,
      status: 'sent',
      sent_at: new Date().toISOString(),
    })
  }

  /**
   * Gibt Zugriff auf den TokenService für Token-Validierung
   */
  getTokenService(): TokenService {
    return this.tokenService
  }
}
