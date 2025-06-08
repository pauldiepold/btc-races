import { NotificationEmailService } from '~/server/email/services'
import type { ApiResponse } from '~/types/api.types'
import { EmailTypes } from '~/types/enums'
import { createRegistrationsRepository } from '~/server/repositories/registrations.repository'

export default defineEventHandler(async (event) => {
  try {
    // Token aus Query-Parametern lesen
    const token = getQuery(event).token as string

    if (!token) {
      return {
        error: {
          message: 'Token fehlt',
          code: 'MISSING_TOKEN',
        },
        statusCode: 400,
      } as ApiResponse<null>
    }

    // E-Mail-Service erstellen
    const emailService = await NotificationEmailService.create(event)

    // Token validieren mit TokenService
    const tokenService = emailService.getTokenService()
    const validationResult = await tokenService.validateToken(token)

    if (!validationResult.success) {
      return {
        error: {
          message: validationResult.message,
          code: 'INVALID_TOKEN',
        },
        statusCode: 400,
      } as ApiResponse<null>
    }

    // Prüfen, ob es sich um eine Abmeldebestätigung handelt
    if (validationResult.emailType !== EmailTypes.REGISTRATION_CANCELLATION) {
      return {
        error: {
          message: 'Ungültiger Token-Typ',
          code: 'INVALID_TOKEN_TYPE',
        },
        statusCode: 400,
      } as ApiResponse<null>
    }

    // Prüfen, ob die Registrierungs-ID vorhanden ist
    if (!validationResult.registrationId) {
      return {
        error: {
          message: 'Ungültige Registrierungs-ID',
          code: 'INVALID_REGISTRATION',
        },
        statusCode: 400,
      } as ApiResponse<null>
    }

    // Repository für die Registrierung erstellen
    const registrationsRepo = await createRegistrationsRepository(
      event,
      'service_role'
    )

    // Wettkampfdetails abrufen, um zu prüfen, ob die Registrierung bereits abgemeldet wurde
    const registration = await registrationsRepo.findWithDetails(
      validationResult.registrationId
    )

    if (!registration || !registration.competition_id) {
      return {
        error: {
          message: 'Registrierungsdaten nicht gefunden',
          code: 'DATABASE_ERROR',
        },
        statusCode: 500,
      } as ApiResponse<null>
    }

    // Prüfen, ob die Registrierung bereits abgemeldet wurde
    const alreadyCanceled = registration.status === 'canceled'

    // Nur abmelden, wenn noch nicht abgemeldet
    let success = true
    if (!alreadyCanceled) {
      // Registrierung abmelden
      success = await registrationsRepo.updateStatus(
        validationResult.registrationId,
        'canceled'
      )

      if (!success) {
        return {
          error: {
            message: 'Fehler beim Abmelden vom Wettkampf',
            code: 'DATABASE_ERROR',
          },
          statusCode: 500,
        } as ApiResponse<null>
      }

      // Token als verifiziert markieren
      const tokenSuccess = await tokenService.markTokenAsVerified(token)
      if (!tokenSuccess) {
        console.error('Fehler beim Markieren des Tokens als verifiziert')
        // Wir geben hier keinen Fehler zurück, da die Hauptaktion (Abmeldung) erfolgreich war
      }
    }

    // Erfolgreiche Antwort mit Wettkampfdetails und Information, ob bereits abgemeldet
    const responseData = {
      success: true,
      alreadyCanceled,
      competition: {
        id: registration.competition_id,
        name: registration.competition_name || 'Wettkampf',
      },
    }

    return {
      data: responseData,
      statusCode: 200,
    } as ApiResponse<typeof responseData>
  } catch (error: any) {
    console.error('Unerwarteter Fehler bei der Abmeldebestätigung:', error)
    return {
      error: {
        message: 'Ein unerwarteter Fehler ist aufgetreten',
        code: 'INTERNAL_ERROR',
        details: error.message,
      },
      statusCode: 500,
    } as ApiResponse<null>
  }
})
