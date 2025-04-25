import type { H3Event } from 'h3'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import { BaseRepository } from '~/repositories/base/base.repository'
import {
  createRepository,
  type ClientType,
} from '~/server/repositories/base/repository.factory'
import type { Member, MemberInsert, MemberUpdate } from '~/types/models.types'

export class MembersRepository extends BaseRepository<
  'members',
  Member,
  MemberInsert,
  MemberUpdate
> {
  constructor(client: SupabaseClient<Database>) {
    super(client, 'members')
  }

  // Mitglied nach ID finden
  async findById(id: number | string): Promise<Member | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', Number(id))
      .single()

    if (error) {
      console.error(`Fehler beim Laden des Mitglieds mit ID ${id}:`, error)
      return null
    }

    return data
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
  async markMembersAsLeft(memberIds: (number | string)[]): Promise<boolean> {
    const { error } = await this.supabase
      .from(this.tableName)
      .update({ has_left: true })
      .in(
        'id',
        memberIds.map((id) => Number(id))
      )

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
export async function createMembersRepository(
  event: H3Event,
  clientType: ClientType = 'user'
): Promise<MembersRepository> {
  return createRepository(event, MembersRepository, clientType)
}
