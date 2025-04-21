import { serverSupabaseServiceRole } from '#supabase/server'
import type { H3Event } from 'h3'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import { BaseRepository } from '~/repositories/base/base.repository'

export class ServiceRoleRepository<
  T extends keyof Database['public']['Tables'],
  Row = Database['public']['Tables'][T]['Row'],
  Insert = Database['public']['Tables'][T]['Insert'],
  Update = Database['public']['Tables'][T]['Update'],
> extends BaseRepository<T, Row, Insert, Update> {
  // Hilfsmethode, um einen Client für die Instanzerstellung zu bekommen
  static async getClient(event: H3Event): Promise<SupabaseClient<Database>> {
    return await serverSupabaseServiceRole<Database>(event)
  }
}
