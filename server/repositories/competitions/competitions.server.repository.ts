import type { H3Event } from 'h3'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import { ServerRepository } from '~/server/repositories/base/server.repository'

import type {
  Competition,
  CompetitionInsert,
  CompetitionUpdate,
} from '~/types/models.types'

// Server-Version
export class CompetitionsServerRepository extends ServerRepository<
  'competitions',
  Competition,
  CompetitionInsert,
  CompetitionUpdate
> {
  constructor(client: SupabaseClient<Database>) {
    super(client, 'competitions')
  }

  // Wettbewerb erstellen
  async createCompetition(
    data: CompetitionInsert
  ): Promise<Competition | null> {
    const { data: result, error } = await this.supabase
      .from(this.tableName)
      .insert(data)
      .select()
      .single()

    if (error) {
      console.error('Fehler beim Erstellen des Wettkampfes:', error)
      return null
    }

    return result
  }

  // Wettbewerb aktualisieren
  async updateCompetition(
    id: number,
    data: CompetitionUpdate
  ): Promise<Competition | null> {
    const { data: result, error } = await this.supabase
      .from(this.tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Fehler beim Aktualisieren des Wettkampfes:', error)
      return null
    }

    return result
  }
}

// Factory-Funktion
export async function createCompetitionsServerRepository(
  event: H3Event
): Promise<CompetitionsServerRepository> {
  const client = await ServerRepository.getClient(event)
  return new CompetitionsServerRepository(client)
}
