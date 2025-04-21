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

  // Hier können spezifische Methoden für das Members-Repository hinzugefügt werden
}
