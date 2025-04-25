import type { H3Event } from 'h3'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import { BaseRepository } from '~/repositories/base/base.repository'
import {
  createRepository,
  type ClientType,
} from '~/server/repositories/base/repository.factory'
import type {
  SentEmail,
  SentEmailInsert,
  SentEmailUpdate,
} from '~/types/models.types'

export class SentEmailsRepository extends BaseRepository<
  'sent_emails',
  SentEmail,
  SentEmailInsert,
  SentEmailUpdate
> {
  constructor(client: SupabaseClient<Database>) {
    super(client, 'sent_emails')
  }

  // E-Mail durch Token finden
  async findByToken(token: string): Promise<SentEmail | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('token', token)
      .single()

    if (error) {
      console.error('Fehler beim Suchen des Tokens:', error)
      return null
    }

    return data
  }

  // E-Mail erstellen
  async create(data: SentEmailInsert): Promise<SentEmail | null> {
    const { data: result, error } = await this.supabase
      .from(this.tableName)
      .insert(data as any)
      .select()
      .single()

    if (error) {
      console.error('Fehler beim Speichern der E-Mail ohne RLS:', error)
      return null
    }

    return result
  }

  // Token als verifiziert markieren
  async markAsVerified(token: string): Promise<boolean> {
    const { error } = await this.supabase
      .from(this.tableName)
      .update({
        token_verified_at: new Date().toISOString(),
      })
      .eq('token', token)

    if (error) {
      console.error('Fehler beim Markieren des Tokens als verifiziert:', error)
      return false
    }

    return true
  }
}

// Factory-Funktion
export async function createSentEmailsRepository(
  event: H3Event,
  clientType: ClientType = 'user'
): Promise<SentEmailsRepository> {
  return createRepository(event, SentEmailsRepository, clientType)
}
