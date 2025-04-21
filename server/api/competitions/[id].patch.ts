import type { ApiResponse } from '~/types/api.types'
import { serverSupabaseUser } from '#supabase/server'
import { competitionSchema } from '~/composables/useCompetitionSchema'
import { createCompetitionsServerRepository } from '~/server/repositories/competitions/competitions.server.repository'

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

  // Repository erstellen
  const competitionsRepo = await createCompetitionsServerRepository(event)
  const body = await readBody(event)
  const id = event.context.params?.id

  if (!id) {
    return {
      error: {
        message: 'Wettkampf-ID fehlt.',
        code: 'MISSING_ID',
      },
      statusCode: 400,
    } as ApiResponse<null>
  }

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
    // Repository-Methode verwenden
    const data = await competitionsRepo.updateCompetition(
      parseInt(id),
      validationResult.data
    )

    if (!data) {
      return {
        error: {
          message: 'Fehler beim Aktualisieren des Wettkampfes.',
          code: 'DATABASE_ERROR',
        },
        statusCode: 500,
      } as ApiResponse<null>
    }

    return {
      data,
      statusCode: 200,
    } as ApiResponse<typeof data>
  } catch (error: any) {
    console.error('Fehler beim Aktualisieren des Wettkampfes:', error)
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
