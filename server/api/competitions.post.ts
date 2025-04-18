import type { ApiResponse } from '~/types/api.types'
import type { Database } from '~/types/database.types'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { competitionSchema } from '~/composables/useCompetitionSchema'

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

  // Validierung mit dem gleichen Schema wie im Frontend
  const validationResult = competitionSchema.safeParse(body)
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
    const { data, error } = await client
      .from('competitions')
      .insert(validationResult.data)
      .select()
      .single()

    if (error) {
      console.error('Supabase Fehler:', error)
      return {
        error: {
          message: 'Fehler beim Erstellen des Wettkampfes.',
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
  } catch (error: any) {
    console.error('Fehler beim Erstellen des Wettkampfes:', error)
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
