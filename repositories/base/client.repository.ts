import type { Database } from '~/types/database.types'
import { BaseRepository } from './base.repository'

export class ClientRepository<
  T extends keyof Database['public']['Tables'],
  Row = Database['public']['Tables'][T]['Row'],
  Insert = Database['public']['Tables'][T]['Insert'],
  Update = Database['public']['Tables'][T]['Update'],
> extends BaseRepository<T, Row, Insert, Update> {
  constructor(tableName: T) {
    const client = useSupabaseClient<Database>()
    super(client, tableName)
  }

  // Hier können Client-spezifische Methoden hinzugefügt werden
}
