/**
 * Hauptservice für den LADV-Service
 */

import { ladvConfig } from '../config'
import { ApiLadvProvider } from '../providers/api'
import { MockLadvProvider } from '../providers/mock'
import type { LadvCompetition } from '~/types/ladv.types'

/**
 * Hauptservice für den LADV-Service
 */
export class LadvService {
  private provider: ApiLadvProvider | MockLadvProvider

  constructor() {
    this.provider =
      ladvConfig.provider === 'api'
        ? new ApiLadvProvider()
        : new MockLadvProvider()
  }

  /**
   * Holt Details zu einem Wettkampf
   */
  async getCompetitionDetails(id: number): Promise<LadvCompetition | null> {
    return await this.provider.getCompetitionDetails(id)
  }

  /**
   * Sucht nach Wettkämpfen
   */
  async searchCompetitions(query: string): Promise<LadvCompetition[]> {
    return await this.provider.searchCompetitions(query)
  }
}
