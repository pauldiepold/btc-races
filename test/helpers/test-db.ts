import { resolve } from 'node:path'
import { createClient } from '@libsql/client'
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'
import * as schema from '~~/server/db/schema'

const MIGRATIONS_FOLDER = resolve(process.cwd(), 'server/db/migrations/sqlite')

export type TestDb = {
  db: LibSQLDatabase<typeof schema>
  schema: typeof schema
  cleanup: () => Promise<void>
}

export async function createTestDb(): Promise<TestDb> {
  const client = createClient({ url: ':memory:' })
  const db = drizzle(client, { schema, casing: 'snake_case' })
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER })
  return {
    db,
    schema,
    cleanup: async () => {
      client.close()
    },
  }
}
