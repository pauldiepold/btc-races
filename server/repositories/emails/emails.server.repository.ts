import type { H3Event } from 'h3'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import { ServerRepository } from '~/server/repositories/base/server.repository'
import type { Email, EmailInsert, EmailUpdate } from '~/types/models.types'

// Email-Repository für die Emails-Tabelle
export class EmailsServerRepository extends ServerRepository<
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
export async function createEmailsServerRepository(
  event: H3Event
): Promise<EmailsServerRepository> {
  const client = await ServerRepository.getClient(event)
  return new EmailsServerRepository(client)
}
