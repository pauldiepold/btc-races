import { RegistrationEmailService } from '@/server/email'
import type { Database } from '~/types/database.types'
import type { ApiResponse } from '~/types/api.types'
import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    // Parse den Request-Body
    const { token } = await readBody(event)

    if (!token) {
      return {
        error: {
          message: 'Token fehlt',
          code: 'MISSING_TOKEN',
        },
        statusCode: 400,
      } as ApiResponse<null>
    }

    // Service Role für nicht-authentifizierte Benutzer verwenden
    const supabase = await serverSupabaseServiceRole<Database>(event)
    const emailService = new RegistrationEmailService(supabase)

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

    // Prüfen, ob es sich um eine Abmeldebestätigung handelt
    if (validationResult.emailType !== 'registration_cancellation') {
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

    const registrationId = validationResult.registrationId

    // Registrierung auf abgemeldet setzen
    const { error } = await supabase
      .from('registrations')
      .update({ status: 'canceled' })
      .eq('id', registrationId)

    if (error) {
      console.error('Fehler beim Abmelden:', error)
      return {
        error: {
          message: 'Fehler beim Abmelden vom Wettkampf',
          code: 'DATABASE_ERROR',
          details: error.message,
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
