import { defineEventHandler } from 'h3'
import { LadvCompetitionService } from '~/server/ladv/services/competition.service'
import { createCompetitionsRepository } from '~/server/repositories/competitions.repository'
import { ladvUrlSchema } from '~/composables/useLadvUrlSchema'
import type { ApiResponse } from '~/types/api.types'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { ladvUrl } = body

  // Validierung mit dem LADV-URL-Schema
  const validationResult = ladvUrlSchema.safeParse({ url: ladvUrl })

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
    // LADV-ID aus der URL extrahieren (Format: https://ladv.de/ausschreibung/detail/[ID]/[Titel])
    const urlParts = ladvUrl.split('/').filter((part: string) => part !== '')
    const detailIndex = urlParts.indexOf('detail')
    if (detailIndex === -1 || detailIndex + 1 >= urlParts.length) {
      return {
        error: {
          message: 'Ungültige LADV-URL',
          code: 'INVALID_URL',
        },
        statusCode: 400,
      } as ApiResponse<null>
    }

    const ladvId = parseInt(urlParts[detailIndex + 1])
    if (!ladvId) {
      return {
        error: {
          message: 'Ungültige LADV-URL',
          code: 'INVALID_URL',
        },
        statusCode: 400,
      } as ApiResponse<null>
    }

    // Prüfen, ob der Wettkampf bereits existiert
    const competitionsRepo = await createCompetitionsRepository(
      event,
      'service_role'
    )
    const existingCompetition = await competitionsRepo.findByLadvId(ladvId)

    if (existingCompetition) {
      return {
        error: {
          message: 'Ein Wettkampf mit dieser LADV-ID existiert bereits',
          code: 'COMPETITION_EXISTS',
          details: existingCompetition.id,
        },
        statusCode: 409,
      } as ApiResponse<null>
    }

    // Wettkampf mit dem neuen Service erstellen
    const ladvService = new LadvCompetitionService(event)
    const competition = await ladvService.createCompetition(ladvId)

    return {
      data: competition,
      statusCode: 201,
    } as ApiResponse<typeof competition>
  } catch (error: any) {
    console.error('Fehler beim Erstellen des Wettkampfs:', error)
    return {
      error: {
        message: error.message || 'Ein unerwarteter Fehler ist aufgetreten',
        code: 'INTERNAL_ERROR',
        details: error.message,
      },
      statusCode: error.statusCode || 500,
    } as ApiResponse<null>
  }
})
