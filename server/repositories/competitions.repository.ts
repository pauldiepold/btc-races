import type { H3Event } from 'h3'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import { BaseRepository } from '~/repositories/base/base.repository'
import {
  createRepository,
  type ClientType,
} from '~/server/repositories/base/repository.factory'
import type {
  Competition,
  CompetitionInsert,
  CompetitionUpdate,
} from '~/types/models.types'

export class CompetitionsRepository extends BaseRepository<
  'competitions',
  Competition,
  CompetitionInsert,
  CompetitionUpdate
> {
  constructor(client: SupabaseClient<Database>) {
    super(client, 'competitions')
  }

  // Wettbewerb nach ID finden
  async findById(id: number): Promise<Competition | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error(`Fehler beim Laden des Wettbewerbs mit ID ${id}:`, error)
      return null
    }

    return data
  }

  // Wettbewerb nach LADV-ID finden
  async findByLadvId(ladvId: number): Promise<Competition | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('ladv_id', ladvId)
      .single()

    if (error) {
      console.error(
        `Fehler beim Laden des Wettbewerbs mit LADV-ID ${ladvId}:`,
        error
      )
      return null
    }

    return data
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

  // LADV-Daten aktualisieren
  async updateLadvData(
    id: number,
    ladvData: Partial<Competition>
  ): Promise<Competition | null> {
    const { data: result, error } = await this.supabase
      .from(this.tableName)
      .update({
        ...ladvData,
        ladv_last_sync: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Fehler beim Aktualisieren der LADV-Daten:', error)
      return null
    }

    return result
  }
}

// Factory-Funktion
export async function createCompetitionsRepository(
  event: H3Event,
  clientType: ClientType = 'user'
): Promise<CompetitionsRepository> {
  return createRepository(event, CompetitionsRepository, clientType)
}
