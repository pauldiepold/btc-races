import { sqliteTable, text, integer, } from 'drizzle-orm/sqlite-core'
import { sql, } from 'drizzle-orm'

// Zentrales User-Modell
export const users = sqliteTable('users', {
  id: text().primaryKey(), // UUID
  email: text().notNull().unique(),
  firstName: text(),
  lastName: text(),
  role: text().$type<'admin' | 'member'>().default('member',),

  // Campai-Sync-Felder
  campaiId: text().unique(),
  membershipNumber: text(),
  membershipStatus: text().$type<'active' | 'inactive'>().default('inactive',),
  membershipEnterDate: integer({ mode: 'timestamp', },),
  membershipLeaveDate: integer({ mode: 'timestamp', },),
  sections: text({ mode: 'json', },).$type<string[]>(),
  lastSyncedAt: integer({ mode: 'timestamp', },),

  createdAt: integer({ mode: 'timestamp', },)
    .notNull()
    .default(sql`(unixepoch())`,),
},)

// Tokens für Magic Links
export const authTokens = sqliteTable('auth_tokens', {
  token: text().primaryKey(),
  userId: text().notNull().references(() => users.id, { onDelete: 'cascade', },),
  expiresAt: integer({ mode: 'timestamp', },).notNull(),
},)
