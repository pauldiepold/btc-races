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

    // Prüfen, ob es sich um eine Anmeldebestätigung handelt
    if (validationResult.emailType !== EmailTypes.REGISTRATION_CONFIRMATION) {
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

    // Repository für die Registrierung erstellen mit Service-Role
    const registrationsRepo = await createRegistrationsRepository(
      event,
      'service_role'
    )

    // Wettkampfdetails abrufen, um zu prüfen, ob die Registrierung bereits bestätigt wurde
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

    // Prüfen, ob die Registrierung bereits bestätigt wurde
    const alreadyConfirmed = registration.status === 'confirmed'

    // Nur bestätigen, wenn noch nicht bestätigt
    let success = true
    if (!alreadyConfirmed) {
      // Registrierung bestätigen
      success = await registrationsRepo.updateStatus(
        validationResult.registrationId,
        'confirmed'
      )

      if (!success) {
        return {
          error: {
            message: 'Fehler beim Bestätigen der Registrierung',
            code: 'DATABASE_ERROR',
          },
          statusCode: 500,
        } as ApiResponse<null>
      }

      // Token als verifiziert markieren
      const tokenSuccess = await tokenService.markTokenAsVerified(token)
      if (!tokenSuccess) {
        console.error('Fehler beim Markieren des Tokens als verifiziert')
        // Wir geben hier keinen Fehler zurück, da die Hauptaktion (Bestätigung) erfolgreich war
      }

      // Mail 2: Coach-Benachrichtigung bei kurzfristiger Anmeldung
      // Prüfen, ob weniger als 3 Tage zwischen Anmeldung und Meldefrist liegen
      if (registration.created_at && registration.registration_deadline) {
        const registrationDate = new Date(registration.created_at)
        const deadlineDate = new Date(registration.registration_deadline)
        const daysDifference = Math.ceil(
          (deadlineDate.getTime() - registrationDate.getTime()) /
            (1000 * 60 * 60 * 24)
        )

        if (daysDifference < 3) {
          try {
            await emailService.sendCoachUrgentRegistrationNotification(
              validationResult.registrationId
            )
            console.log(
              `Coach-Benachrichtigung wegen kurzfristiger Anmeldung gesendet für Registrierung ${validationResult.registrationId}`
            )
          } catch (emailError) {
            console.error(
              'Fehler beim Senden der Coach-Benachrichtigung:',
              emailError
            )
            // Fehler wird nicht an den User weitergegeben, da die Hauptaktion erfolgreich war
          }
        }
      }

      // Mail 3: Bestätigungsdetails senden
      try {
        await emailService.sendRegistrationConfirmationDetails(
          validationResult.registrationId
        )
        console.log(
          `Bestätigungsdetails gesendet für Registrierung ${validationResult.registrationId}`
        )
      } catch (emailError) {
        console.error('Fehler beim Senden der Bestätigungsdetails:', emailError)
        // Fehler wird nicht an den User weitergegeben, da die Hauptaktion erfolgreich war
      }
    }

    // Erfolgreiche Antwort mit Wettkampfdetails und Information, ob bereits bestätigt
    const responseData = {
      success: true,
      alreadyConfirmed,
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
    console.error(
      'Unerwarteter Fehler bei der Registrierungsbestätigung:',
      error
    )
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
