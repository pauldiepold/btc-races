import { randomBytes } from 'crypto'
import type { EmailType } from '~/types/enums'
import type { SentEmailsRepository } from '~/server/repositories/sent-emails.repository'

/**
 * Service für Token-Funktionalitäten im E-Mail-System
 * (Generierung, Validierung, Ablaufdaten)
 */
export class TokenService {
  // Gültigkeitsdauer des Tokens in Millisekunden (7 Tage)
  private readonly TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000

  /**
   * Konstruktor für den TokenService
   */
  constructor(private readonly sentEmailsRepo: SentEmailsRepository) {}

  /**
   * Generiert einen zufälligen Token für E-Mail-Bestätigungen
   */
  generateToken(): string {
    return randomBytes(32).toString('hex')
  }

  /**
   * Berechnet das Ablaufdatum für einen neu erstellten Token
   */
  getExpiryDate(): Date {
    return new Date(Date.now() + this.TOKEN_EXPIRY_MS)
  }

  /**
   * Prüft, ob ein Token gültig ist
   */
  async validateToken(token: string): Promise<{
    success: boolean
    message: string
    emailType?: EmailType
    registrationId?: number
  }> {
    // E-Mail-Log mit dem gegebenen Token suchen
    const emailLog = await this.sentEmailsRepo.findByToken(token)

    if (!emailLog) {
      return {
        success: false,
        message: 'Ungültiger oder abgelaufener Token',
      }
    }

    // Prüfen, ob der Token abgelaufen ist
    if (emailLog.token_expires_at) {
      const expiryDate = new Date(emailLog.token_expires_at)
      if (expiryDate < new Date()) {
        return {
          success: false,
          message: 'Der Bestätigungslink ist abgelaufen',
        }
      }
    }

    return {
      success: true,
      message: 'Token ist gültig',
      emailType: emailLog.email_type as EmailType,
      registrationId: emailLog.registration_id!,
    }
  }
}
