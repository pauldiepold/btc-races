import { RegistrationEmailsService } from '~/server/email/services'
import type { ApiResponse } from '~/types/api.types'
import { EmailTypes } from '~/types/enums'
import { createRegistrationsRepository } from '~/server/repositories/registrations/registrations.repository'

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
    const emailService = await RegistrationEmailsService.create(event)

    // Token validieren
    const validationResult = await emailService.validateToken(token)

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

    // Registrierung bestätigen
    const success = await registrationsRepo.updateStatus(
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

    // Erfolgreiche Antwort
    const responseData = { success: true }
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
