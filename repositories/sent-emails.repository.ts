import { ClientRepository } from './base/client.repository'
import type {
  SentEmail,
  SentEmailInsert,
  SentEmailUpdate,
} from '~/types/models.types'

// Client-Version
export class SentEmailsClientRepository extends ClientRepository<
  'sent_emails',
  SentEmail,
  SentEmailInsert,
  SentEmailUpdate
> {
  constructor() {
    super('sent_emails')
  }

  // Spezifische Methoden für sent_emails
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

  async findPendingEmails(): Promise<SentEmail[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Fehler beim Laden der ausstehenden E-Mails:', error)
      return []
    }

    return data || []
  }

  async markAsSent(id: number, sentAt: string): Promise<boolean> {
    const { error } = await this.supabase
      .from(this.tableName)
      .update({
        status: 'sent',
        sent_at: sentAt,
      })
      .eq('id', id as any)

    if (error) {
      console.error('Fehler beim Markieren der E-Mail als gesendet:', error)
      return false
    }

    return true
  }

  async markAsFailed(id: number, errorMessage: string): Promise<boolean> {
    // Zuerst die aktuelle Anzahl der Wiederholungsversuche abrufen
    const { data: currentEmail } = await this.supabase
      .from(this.tableName)
      .select('retry_count')
      .eq('id', id as any)
      .single()

    const currentRetryCount = currentEmail?.retry_count || 0

    // Dann das Update durchführen
    const { error } = await this.supabase
      .from(this.tableName)
      .update({
        status: 'failed',
        error: errorMessage,
        retry_count: currentRetryCount + 1,
      })
      .eq('id', id as any)

    if (error) {
      console.error(
        'Fehler beim Markieren der E-Mail als fehlgeschlagen:',
        error
      )
      return false
    }

    return true
  }

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
