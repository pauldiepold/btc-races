import type { H3Event } from 'h3'
import { LadvService } from './api.service'
import { createCompetitionsRepository } from '~/server/repositories/competitions.repository'
import type { Competition } from '~/types/models.types'
import { format } from 'date-fns-tz'
import { ChampionshipTypes, RaceTypes, RegistrationTypes } from '~/types/enums'

type LadvCompetitionData = {
  id: number
  name: string
  ort: { name: string }
  url: string
  veranstalter: string
  ausrichter: string
  sportstaette: string
  beschreibung: string
  datum: number
  meldDatum: number
}

export class LadvCompetitionService {
  private ladvService: LadvService
  private event: H3Event

  constructor(event: H3Event) {
    this.ladvService = new LadvService()
    this.event = event
  }

  /**
   * Konvertiert ein Datum in die Berliner Zeitzone
   */
  private convertToBerlinTime(timestamp: string | Date | number): string {
    return format(new Date(timestamp), 'yyyy-MM-dd', { timeZone: 'Europe/Berlin' })
  }

  /**
   * Mapped LADV-Daten auf das Competition-Format
   */
  private mapLadvDataToCompetition(ladvData: LadvCompetitionData, isNewCompetition: boolean = false): Partial<Competition> {
    const baseData = {
      name: ladvData.name,
      location: ladvData.ort.name,
      announcement_link: ladvData.url,
      veranstalter: ladvData.veranstalter,
      ausrichter: ladvData.ausrichter,
      sportstaette: ladvData.sportstaette,
      ladv_description: ladvData.beschreibung,
      ladv_data: JSON.parse(JSON.stringify(ladvData)),
      date: this.convertToBerlinTime(ladvData.datum),
      registration_deadline: this.convertToBerlinTime(ladvData.meldDatum),
      ladv_id: ladvData.id,
      ladv_last_sync: new Date().toISOString(),
    }

    if (isNewCompetition) {
      return {
        ...baseData,
        race_type: RaceTypes.TRACK,
        registration_type: RegistrationTypes.LADV,
        championship_type: ChampionshipTypes.NO_CHAMPIONSHIP,
      }
    }

    return baseData
  }

  /**
   * Erstellt einen neuen Wettkampf aus LADV-Daten
   */
  async createCompetition(ladvId: number): Promise<Competition> {
    const ladvData = await this.ladvService.getCompetitionDetails(ladvId)
    if (!ladvData) {
      throw new Error('LADV-Daten konnten nicht abgerufen werden')
    }

    const competitionsRepo = await createCompetitionsRepository(this.event, 'service_role')
    const competition = await competitionsRepo.createCompetition(
      this.mapLadvDataToCompetition(ladvData, true) as Competition
    )
    
    if (!competition) {
      throw new Error('Fehler beim Erstellen des Wettkampfs')
    }
    
    return competition
  }

  /**
   * Synchronisiert einen bestehenden Wettkampf mit LADV-Daten
   */
  async syncCompetition(competitionId: number): Promise<Competition | null> {
    const competitionsRepo = await createCompetitionsRepository(this.event, 'service_role')
    const competition = await competitionsRepo.findById(competitionId)

    if (!competition) {
      throw new Error(`Wettkampf mit ID ${competitionId} nicht gefunden`)
    }

    if (!competition.ladv_id) {
      throw new Error('Wettkampf hat keine LADV-ID')
    }

    const ladvData = await this.ladvService.getCompetitionDetails(competition.ladv_id)
    if (!ladvData) {
      throw new Error('LADV-Daten konnten nicht abgerufen werden')
    }

    return await competitionsRepo.updateLadvData(
      competitionId,
      this.mapLadvDataToCompetition(ladvData, false)
    )
  }
} 