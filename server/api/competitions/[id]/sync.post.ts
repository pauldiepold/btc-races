import { LadvCompetitionService } from '~/server/ladv/services/competition.service'
import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    // Authentifizierung prüfen
    const user = await serverSupabaseUser(event)
    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Nicht autorisiert. Bitte melden Sie sich an.',
      })
    }

    // Wettkampf-ID aus der URL holen
    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Wettkampf-ID fehlt',
      })
    }

    // Synchronisation durchführen
    const syncService = new LadvCompetitionService(event)
    const result = await syncService.syncCompetition(Number(id))

    if (!result) {
      throw createError({
        statusCode: 500,
        message: 'Synchronisation fehlgeschlagen',
      })
    }

    return {
      success: true,
      data: result,
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Ein Fehler ist aufgetreten',
    })
  }
})
