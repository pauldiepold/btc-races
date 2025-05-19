import { ClientRepository } from './base/client.repository'
import type { Member, MemberInsert, MemberUpdate } from '~/types/models.types'

export class MembersClientRepository extends ClientRepository<
  'members',
  Member,
  MemberInsert,
  MemberUpdate
> {
  constructor() {
    super('members')
  }

  /**
   * Alle aktiven Mitglieder nach Namen sortiert abrufen
   * @returns Liste der aktiven Mitglieder
   */
  async findAllActiveOrderedByName(): Promise<Member[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('id, name, has_left, created_at, updated_at, has_ladv_startpass')
      .eq('has_left', false)
      .order('name')

    if (error) {
      console.error('Fehler beim Laden der Mitglieder:', error)
      return []
    }

    return data || []
  }

  // Hier können spezifische Methoden für das Members-Repository hinzugefügt werden
}
