import type { H3Event } from 'h3'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import { ServerRepository } from '~/server/repositories/base/server.repository'
import { ServiceRoleRepository } from '~/server/repositories/base/service-role.repository'
import type {
  SentEmailRow,
  SentEmailInsert,
  SentEmailUpdate,
} from '~/repositories/sent-emails/sent-emails.repository'

// Server-Version
export class SentEmailsServerRepository extends ServerRepository<
  'sent_emails',
  SentEmailRow,
  SentEmailInsert,
  SentEmailUpdate
> {
  constructor(client: SupabaseClient<Database>) {
    super(client, 'sent_emails')
  }

  // Server-spezifische Methoden
  async findByToken(token: string): Promise<SentEmailRow | null> {
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

  // Weitere Methoden wie in der Client-Version...
}

// Factory-Funktion für Server-Repository
export async function createSentEmailsServerRepository(
  event: H3Event
): Promise<SentEmailsServerRepository> {
  const client = await ServerRepository.getClient(event)
  return new SentEmailsServerRepository(client)
}

// ServiceRole-Version
export class SentEmailsServiceRepository extends ServiceRoleRepository<
  'sent_emails',
  SentEmailRow,
  SentEmailInsert,
  SentEmailUpdate
> {
  constructor(client: SupabaseClient<Database>) {
    super(client, 'sent_emails')
  }

  // ServiceRole-spezifische Methoden
  async createWithoutRLS(data: SentEmailInsert): Promise<SentEmailRow | null> {
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

  // Weitere ServiceRole-spezifische Methoden...
}

// Factory-Funktion für ServiceRole-Repository
export async function createSentEmailsServiceRepository(
  event: H3Event
): Promise<SentEmailsServiceRepository> {
  const client = await ServiceRoleRepository.getClient(event)
  return new SentEmailsServiceRepository(client)
}
