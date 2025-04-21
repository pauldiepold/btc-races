import type { H3Event } from 'h3'
import type { EmailType } from '~/types/enums'
import { EmailTypes } from '~/types/enums'
import { TokenService } from './token.service'
import { TemplateService } from './template.service'
import { EmailSenderService } from './email-sender.service'
import type { SentEmailsRepository } from '~/server/repositories/sent-emails.repository'
import { createSentEmailsRepository } from '~/server/repositories/sent-emails.repository'
import type { RegistrationsRepository } from '~/server/repositories/registrations.repository'
import { createRegistrationsRepository } from '~/server/repositories/registrations.repository'

/**
 * Service für die Verwaltung von E-Mails im Zusammenhang mit Registrierungen
 */
export class RegistrationEmailsService {
  private templateService: TemplateService
  private emailSender: EmailSenderService

  constructor(
    private readonly sentEmailsRepo: SentEmailsRepository,
    private readonly registrationsRepo: RegistrationsRepository,
    private readonly tokenService: TokenService
  ) {
    this.templateService = new TemplateService()
    this.emailSender = new EmailSenderService()
  }

  /**
   * Factory-Methode zum Erstellen des Services mit Repositories
   */
  static async create(event: H3Event): Promise<RegistrationEmailsService> {
    const sentEmailsRepo = await createSentEmailsRepository(
      event,
      'service_role'
    )
    const registrationsRepo = await createRegistrationsRepository(
      event,
      'service_role'
    )
    const tokenService = new TokenService(sentEmailsRepo)

    return new RegistrationEmailsService(
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

    // 4. Sende E-Mail mit EmailSenderService
    const subject = `Anmeldebestätigung für ${registration.competition_name}`

    await this.emailSender.sendEmailWithTemplate({
      to: [
        {
          address: registration.member_email!,
          displayName: registration.member_name!,
        },
      ],
      subject,
      templateName: 'registration-confirmation',
      templateData,
    })

    // 5. Protokolliere versendete E-Mail mit Repository
    await this.sentEmailsRepo.createWithoutRLS({
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

    // 4. Sende E-Mail mit EmailSenderService
    const subject = `Abmeldebestätigung für ${registration.competition_name}`

    await this.emailSender.sendEmailWithTemplate({
      to: [
        {
          address: registration.member_email!,
          displayName: registration.member_name!,
        },
      ],
      subject,
      templateName: 'registration-cancellation',
      templateData,
    })

    // 5. Protokolliere versendete E-Mail mit Repository
    await this.sentEmailsRepo.createWithoutRLS({
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
   * Prüft, ob ein Token gültig ist und gibt die zugehörigen Informationen zurück
   */
  async validateToken(token: string): Promise<{
    success: boolean
    message: string
    emailType?: EmailType
    registrationId?: number
  }> {
    return this.tokenService.validateToken(token)
  }
}
