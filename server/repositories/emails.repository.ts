import type { H3Event } from 'h3'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import { BaseRepository } from '~/repositories/base/base.repository'
import {
  createRepository,
  type ClientType,
} from '~/server/repositories/base/repository.factory'
import type { Email, EmailInsert, EmailUpdate } from '~/types/models.types'

export class EmailsRepository extends BaseRepository<
  'emails',
  Email,
  EmailInsert,
  EmailUpdate
> {
  constructor(client: SupabaseClient<Database>) {
    super(client, 'emails')
  }

  // E-Mails in Batches einfügen/aktualisieren
  async upsertEmails(emails: EmailInsert[]): Promise<boolean> {
    const { error } = await this.supabase.from(this.tableName).upsert(emails, {
      onConflict: 'member_id',
    })

    if (error) {
      console.error('Fehler beim Einfügen/Aktualisieren der E-Mails:', error)
      return false
    }

    return true
  }
}

// Factory-Funktion
export async function createEmailsRepository(
  event: H3Event,
  clientType: ClientType = 'user'
): Promise<EmailsRepository> {
  return createRepository(event, EmailsRepository, clientType)
}
