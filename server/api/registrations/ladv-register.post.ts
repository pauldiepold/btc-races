import type { ApiResponse } from '~/types/api.types'
import { serverSupabaseUser } from '#supabase/server'
import { createRegistrationsRepository } from '~/server/repositories/registrations.repository'
import { NotificationEmailService } from '~/server/email/services'

export default defineEventHandler(async (event) => {
  try {
    // Authentifizierung prüfen
    const user = await serverSupabaseUser(event)
    if (!user) {
      return {
        error: {
          message: 'Nicht autorisiert. Bitte melden Sie sich an.',
          code: 'UNAUTHORIZED',
        },
        statusCode: 401,
      } as ApiResponse<null>
    }

    // Request Body lesen
    const body = await readBody(event)
    const { registrationId } = body

    if (!registrationId) {
      return {
        error: {
          message: 'Registrierungs-ID fehlt',
          code: 'MISSING_REGISTRATION_ID',
        },
        statusCode: 400,
      } as ApiResponse<null>
    }

    // Coach-Name aus User-Metadaten
    const coachName = user.user_metadata?.full_name
    if (!coachName) {
      return {
        error: {
          message: 'Coach-Name nicht verfügbar',
          code: 'MISSING_COACH_NAME',
        },
        statusCode: 400,
      } as ApiResponse<null>
    }

    // Repository mit Service-Role erstellen
    const registrationsRepo = await createRegistrationsRepository(
      event,
      'service_role'
    )

    // Registrierung laden
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

    // LADV-Anmeldung durchführen
    const success = await registrationsRepo.registerToLADV(
      parseInt(registrationId),
      coachName
    )
    if (!success) {
      return {
        error: {
          message: 'Fehler bei der LADV-Anmeldung',
          code: 'LADV_REGISTRATION_FAILED',
        },
        statusCode: 500,
      } as ApiResponse<null>
    }

    // Mail 1: LADV-Anmeldung durch Coach benachrichtigen
    try {
      const emailService = await NotificationEmailService.create(event)
      await emailService.sendLadvRegistrationByCoach(parseInt(registrationId))
      console.log(
        `LADV-Anmeldungsmail gesendet für Registrierung ${registrationId}`
      )
    } catch (emailError) {
      console.error('Fehler beim Senden der LADV-Anmeldungsmail:', emailError)
      // Fehler wird nicht an den User weitergegeben, da die Hauptaktion erfolgreich war
    }

    return {
      data: {
        success: true,
        registrationId: parseInt(registrationId),
        coachName,
      },
      statusCode: 200,
    } as ApiResponse<{
      success: boolean
      registrationId: number
      coachName: string
    }>
  } catch (error: any) {
    console.error('Unerwarteter Fehler bei der LADV-Anmeldung:', error)
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
