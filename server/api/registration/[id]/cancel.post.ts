import type { ApiResponse } from '~/types/api.types'
import { RegistrationEmailsService } from '~/server/email/services'
import { createRegistrationsRepository } from '~/server/repositories/registrations.repository'
import { RegistrationStatuses } from '~/types/enums'
import type { RegistrationStatus } from '~/types/enums'

export default defineEventHandler(async (event) => {
  try {
    // Registrierungs-ID aus dem Pfad lesen
    const registrationId = parseInt(event.context.params?.id || '0')

    if (!registrationId) {
      return {
        error: {
          message: 'Ungültige Registrierungs-ID',
          code: 'INVALID_REGISTRATION_ID',
        },
        statusCode: 400,
      } as ApiResponse<null>
    }

    // Repository mit Service-Role erstellen für Schreibzugriff
    const registrationsRepo = await createRegistrationsRepository(
      event,
      'service_role'
    )

    // Details der Registrierung abrufen
    const registration = await registrationsRepo.findWithDetails(registrationId)

    if (!registration) {
      return {
        error: {
          message: 'Registrierung nicht gefunden',
          code: 'REGISTRATION_NOT_FOUND',
        },
        statusCode: 404,
      } as ApiResponse<null>
    }

    // Prüfen, ob die Registrierung bereits abgemeldet ist
    if (
      registration.status === RegistrationStatuses.CANCELED ||
      registration.status === RegistrationStatuses.PENDING_CANCELLATION
    ) {
      return {
        error: {
          message:
            'Registrierung ist bereits im Abmeldeprozess oder abgemeldet',
          code: 'ALREADY_CANCELED',
        },
        statusCode: 400,
      } as ApiResponse<null>
    }

    // Status auf "pending_cancellation" setzen
    const success = await registrationsRepo.updateStatus(
      registrationId,
      RegistrationStatuses.PENDING_CANCELLATION
    )

    if (!success) {
      return {
        error: {
          message: 'Fehler beim Setzen des Abmeldestatus',
          code: 'DATABASE_ERROR',
        },
        statusCode: 500,
      } as ApiResponse<null>
    }

    // Abmelde-E-Mail senden
    let emailSent = true
    try {
      const emailService = await RegistrationEmailsService.create(event)
      await emailService.sendRegistrationCancellation(registrationId)
      console.log(
        `Abmeldebestätigung für Registrierung ${registrationId} wurde gesendet`
      )
    } catch (emailError: any) {
      emailSent = false
      console.error('Fehler beim Senden der Abmeldebestätigung:', emailError)

      // Status wieder zurücksetzen, da die E-Mail nicht gesendet werden konnte
      await registrationsRepo.updateStatus(
        registrationId,
        registration.status as RegistrationStatus
      )

      return {
        error: {
          message:
            'Die Abmeldebestätigung konnte nicht gesendet werden. Bitte versuche es später erneut.',
          code: 'EMAIL_ERROR',
          details: emailError.message,
        },
        statusCode: 500,
      } as ApiResponse<null>
    }

    return {
      data: {
        success: true,
        message:
          'Abmeldeprozess wurde eingeleitet. Bitte bestätige die Abmeldung über den Link in der E-Mail.',
        emailSent,
      },
      statusCode: 200,
    } as ApiResponse<{ success: boolean; message: string; emailSent: boolean }>
  } catch (error: any) {
    console.error('Fehler beim Abmelden der Registrierung:', error)
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
