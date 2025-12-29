import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// Zentrales User-Modell
export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // UUID
  email: text('email').notNull().unique(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  role: text('role').$type<'admin' | 'member'>().default('member'),

  // Campai-Sync-Felder
  campaiId: text('campai_id').unique(),
  membershipNumber: text('membership_number'),
  membershipStatus: text('membership_status').$type<'active' | 'inactive'>().default('inactive'),
  membershipEnterDate: integer('membership_enter_date', { mode: 'timestamp' }),
  membershipLeaveDate: integer('membership_leave_date', { mode: 'timestamp' }),
  sections: text('sections', { mode: 'json' }).$type<string[]>(),
  lastSyncedAt: integer('last_synced_at', { mode: 'timestamp' }),

  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
})

// Tokens für Magic Links
export const authTokens = sqliteTable('auth_tokens', {
  token: text('token').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
})
