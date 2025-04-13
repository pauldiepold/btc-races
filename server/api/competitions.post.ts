import type { ApiResponse } from '~/types/api'
import type { Database } from '~/types/database.types'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { validateCompetition } from '../validations/competition.schema'

export default defineEventHandler(async (event) => {
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

  const client = await serverSupabaseClient<Database>(event)
  const body = await readBody(event)

  // Validierung mit Zod Schema
  const { data: validatedData, error: validationError } =
    await validateCompetition(body)
  if (validationError) {
    return {
      error: validationError,
      statusCode: 400,
    } as ApiResponse<null>
  }

  try {
    const { data, error } = await client
      .from('competitions')
      .insert({
        ...validatedData,
      } as Database['public']['Tables']['competitions']['Insert'])
      .select()
      .single()

    if (error) {
      console.error('Supabase Fehler:', error)
      return {
        error: {
          message: 'Fehler beim Erstellen der Veranstaltung',
          code: 'DATABASE_ERROR',
          details: error.message,
        },
        statusCode: 500,
      } as ApiResponse<null>
    }

    return {
      data,
      statusCode: 201,
    } as ApiResponse<typeof data>
  } catch (error) {
    console.error('Fehler beim Erstellen der Veranstaltung:', error)
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
