import { ClientRepository } from '../base/client.repository'
import type { Database } from '~/types/database.types'

export type MemberRow = Database['public']['Tables']['members']['Row']
export type MemberInsert = Database['public']['Tables']['members']['Insert']
export type MemberUpdate = Database['public']['Tables']['members']['Update']

export class MembersClientRepository extends ClientRepository<
  'members',
  MemberRow,
  MemberInsert,
  MemberUpdate
> {
  constructor() {
    super('members')
  }

  // Hier können spezifische Methoden für das Members-Repository hinzugefügt werden
}
