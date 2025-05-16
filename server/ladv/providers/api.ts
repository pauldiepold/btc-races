/**
 * API-Provider für den LADV-Service
 */

import type { LadvCompetition } from '~/types/ladv.types'
import { ladvConfig } from '../config'

const BASE_URL = 'https://ladv.de/api'

/**
 * API-Provider für den LADV-Service
 */
export class ApiLadvProvider {
  private readonly apiKey: string

  constructor() {
    if (!ladvConfig.apiKey) {
      throw new Error('API-Key ist nicht konfiguriert')
    }
    this.apiKey = ladvConfig.apiKey
  }

  /**
   * Holt Details zu einem Wettkampf
   */
  async getCompetitionDetails(id: number): Promise<LadvCompetition | null> {
    const url = `${BASE_URL}/${this.apiKey}/ausDetail?id=${id}&wettbewerbe=true&all=true`

    try {
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`API-Fehler: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data[0] || null
    } catch (error) {
      console.error('Fehler beim Abrufen der Wettkampfdetails:', error)
      throw error
    }
  }

  /**
   * Sucht nach Wettkämpfen
   * @todo Implementierung der Suche, wenn die API verfügbar ist
   */
  async searchCompetitions(query: string): Promise<LadvCompetition[]> {
    console.log(query)
    throw new Error('Suche noch nicht implementiert')
  }
}
