import {
  serverSupabaseClient,
  serverSupabaseServiceRole,
} from '#supabase/server'
import type { H3Event } from 'h3'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import type { BaseRepository } from '~/repositories/base/base.repository'

export type ClientType = 'user' | 'service_role'

export async function getSupabaseClient(
  event: H3Event,
  clientType: ClientType = 'user'
): Promise<SupabaseClient<Database>> {
  return clientType === 'service_role'
    ? await serverSupabaseServiceRole<Database>(event)
    : await serverSupabaseClient<Database>(event)
}

export async function createRepository<
  T extends keyof Database['public']['Tables'],
  R extends BaseRepository<T, any, any, any>,
  ConstructorType extends new (
    client: SupabaseClient<Database>,
    ...args: any[]
  ) => R,
>(
  event: H3Event,
  RepositoryClass: ConstructorType,
  clientType: ClientType = 'user',
  ...constructorArgs: any[]
): Promise<R> {
  const client = await getSupabaseClient(event, clientType)
  return new RepositoryClass(client, ...constructorArgs)
}
