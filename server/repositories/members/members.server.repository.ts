import type { H3Event } from 'h3'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import { ServerRepository } from '~/server/repositories/base/server.repository'
import type { Member, MemberInsert, MemberUpdate } from '~/types/models.types'

export class MembersServerRepository extends ServerRepository<
  'members',
  Member,
  MemberInsert,
  MemberUpdate
> {
  constructor(client: SupabaseClient<Database>) {
    super(client, 'members')
  }

  // Alle bestehenden Mitglieder abrufen
  async findAllMembers(): Promise<Pick<Member, 'id' | 'has_left'>[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('id, has_left')

    if (error) {
      console.error('Fehler beim Abrufen der Mitglieder:', error)
      return []
    }

    return data || []
  }

  // Alle Mitglieder als ausgetreten markieren
  async markMembersAsLeft(memberIds: number[]): Promise<boolean> {
    const { error } = await this.supabase
      .from(this.tableName)
      .update({ has_left: true })
      .in('id', memberIds)

    if (error) {
      console.error('Fehler beim Aktualisieren der Mitglieder:', error)
      return false
    }

    return true
  }

  // Mitglieder in Batches einfügen/aktualisieren
  async upsertMembers(members: MemberInsert[]): Promise<boolean> {
    const { error } = await this.supabase.from(this.tableName).upsert(members, {
      onConflict: 'id',
    })

    if (error) {
      console.error('Fehler beim Einfügen/Aktualisieren der Mitglieder:', error)
      return false
    }

    return true
  }
}

// Factory-Funktion
export async function createMembersServerRepository(
  event: H3Event
): Promise<MembersServerRepository> {
  const client = await ServerRepository.getClient(event)
  return new MembersServerRepository(client)
}
