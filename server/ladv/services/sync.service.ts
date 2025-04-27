import type { H3Event } from 'h3'
import { LadvService } from './api.service'
import { createCompetitionsRepository } from '~/server/repositories/competitions.repository'
import type { Competition } from '~/types/models.types'

export class LadvSyncService {
  private ladvService: LadvService
  private event: H3Event

  constructor(event: H3Event) {
    this.ladvService = new LadvService()
    this.event = event
  }

  /**
   * Synchronisiert einen Wettkampf mit LADV-Daten
   */
  async syncCompetition(competitionId: number): Promise<Competition | null> {
    // Wettkampf aus der Datenbank laden
    const competitionsRepo = await createCompetitionsRepository(this.event)
    const competition = await competitionsRepo.findById(competitionId)

    if (!competition) {
      throw new Error(`Wettkampf mit ID ${competitionId} nicht gefunden`)
    }

    if (!competition.ladv_id) {
      throw new Error('Wettkampf hat keine LADV-ID')
    }

    // LADV-Daten abrufen
    const ladvData = await this.ladvService.getCompetitionDetails(competition.ladv_id)
    if (!ladvData) {
      throw new Error('LADV-Daten konnten nicht abgerufen werden')
    }

    // Daten für die Aktualisierung vorbereiten
    const updateData = {
      name: ladvData.name,
      veranstalter: ladvData.veranstalter,
      ausrichter: ladvData.ausrichter,
      sportstaette: ladvData.sportstaette,
      ladv_description: ladvData.beschreibung,
      ladv_data: JSON.parse(JSON.stringify(ladvData)), // Konvertiere zu einfachem JSON
      date: new Date(ladvData.datum).toISOString(),
      registration_deadline: new Date(ladvData.meldDatum).toISOString()
    }

    // Daten in der Datenbank aktualisieren
    return await competitionsRepo.updateLadvData(competitionId, updateData)
  }
} 