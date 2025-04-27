import { defineEventHandler } from 'h3'
import { LadvService } from '~/server/ladv/services/api.service'
import { createCompetitionsRepository } from '~/server/repositories/competitions.repository'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { ladvUrl } = body

  if (!ladvUrl) {
    throw createError({
      statusCode: 400,
      message: 'LADV-URL ist erforderlich',
    })
  }

  try {
    // LADV-ID aus der URL extrahieren
    const ladvId = ladvUrl.split('/').pop()
    if (!ladvId) {
      throw createError({
        statusCode: 400,
        message: 'Ungültige LADV-URL',
      })
    }

    // LADV-Daten abrufen
    const ladvService = new LadvService()
    const ladvData = await ladvService.getCompetitionDetails(parseInt(ladvId))

    if (!ladvData) {
      throw createError({
        statusCode: 404,
        message: 'Wettkampf nicht gefunden',
      })
    }

    // Wettkampf in der Datenbank erstellen
    const competitionsRepo = await createCompetitionsRepository(event)
    const competition = await competitionsRepo.createCompetition({
      name: ladvData.name,
      location: ladvData.sportstaette,
      date: new Date(ladvData.datum).toISOString(),
      registration_deadline: new Date(ladvData.meldDatum).toISOString(),
      description: ladvData.beschreibung,
      ladv_id: ladvData.id,
      ladv_data: ladvData,
      veranstalter: ladvData.veranstalter,
      ausrichter: ladvData.ausrichter,
      sportstaette: ladvData.sportstaette,
      ladv_description: ladvData.beschreibung,
    })

    return { data: competition }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Fehler beim Erstellen des Wettkampfs',
    })
  }
}) 