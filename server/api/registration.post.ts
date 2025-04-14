import type { ApiResponse } from '~/types/api'
import type { Database } from '~/types/database.types'
import { serverSupabaseServiceRole } from '#supabase/server'
import { registrationSchema } from '~/composables/useRegistrationSchema'
import { generateToken } from './../utils/token'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseServiceRole<Database>(event)
  const body = await readBody(event)

  // Validierung mit dem Schema
  const validationResult = registrationSchema.safeParse(body)
  if (!validationResult.success) {
    return {
      error: {
        message: 'Validierungsfehler',
        code: 'VALIDATION_ERROR',
        details: validationResult.error.errors,
      },
      statusCode: 400,
    } as ApiResponse<null>
  }

  try {
    // Generiere einen Verifizierungstoken
    const verificationToken = generateToken()

    // Erstelle die Anmeldung
    const { data, error } = await client
      .from('registrations')
      .insert({
        member_id: validationResult.data.member_id,
        competition_id: validationResult.data.competition_id,
        notes: validationResult.data.notes,
        verification_token: verificationToken,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase Fehler:', error)
      return {
        error: {
          message: 'Fehler beim Erstellen der Anmeldung.',
          code: 'DATABASE_ERROR',
          details: error.message,
        },
        statusCode: 500,
      } as ApiResponse<null>
    }

    // TODO: Sende Bestätigungsmail mit Verifizierungslink

    return {
      data,
      statusCode: 201,
    } as ApiResponse<typeof data>
  } catch (error: any) {
    console.error('Fehler beim Erstellen der Anmeldung:', error)
    return {
      error: {
        message: 'Ein unerwarteter Fehler ist aufgetreten.',
        code: 'INTERNAL_ERROR',
        details: error.message,
      },
      statusCode: 500,
    } as ApiResponse<null>
  }
}) 