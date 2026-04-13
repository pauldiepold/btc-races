import { sqliteTable, text, integer, unique } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// Zentrales User-Modell
export const users = sqliteTable('users', {
  id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
  email: text().notNull().unique(),
  firstName: text(),
  lastName: text(),
  role: text().$type<'member' | 'admin' | 'superuser'>().default('member'),

  // Campai-Sync-Felder
  campaiId: text().unique(),
  membershipNumber: text(),
  membershipStatus: text().$type<'active' | 'inactive'>().default('inactive'),
  membershipEnterDate: integer({ mode: 'timestamp' }),
  membershipLeaveDate: integer({ mode: 'timestamp' }),
  sections: text({ mode: 'json' }).$type<string[]>(),
  lastSyncedAt: integer({ mode: 'timestamp' }),
  avatarUrl: text(),
  avatarSmall: text(), // base64 JPEG, 64×64
  avatarLarge: text(), // base64 JPEG, 128×128
  avatarUpdatedAt: text(), // ISO-Timestamp, für ETag
  avatarNeedsResync: integer().default(0), // 1 wenn avatarUrl sich seit letztem Cache geändert hat
  hasLadvStartpass: integer().default(0),
  gender: text().$type<'m' | 'w'>(),
  age: integer(),
  birthday: integer({ mode: 'timestamp' }),

  createdAt: integer({ mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

// Tokens für Magic Links
export const authTokens = sqliteTable('auth_tokens', {
  token: text().primaryKey(),
  userId: integer({ mode: 'number' }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer({ mode: 'timestamp' }).notNull(),
})

// Events (alle Typen in einer Tabelle)
export const events = sqliteTable('events', {
  id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
  type: text().notNull().$type<'ladv' | 'competition' | 'training' | 'social'>(),
  name: text().notNull(),
  date: text(), // YYYY-MM-DD (kein Timezone-Overhead, LADV liefert immer Berliner Mitternacht)
  startTime: text(), // HH:MM, optional
  duration: integer(), // Minuten, optional
  location: text(),
  description: text(),
  registrationDeadline: text(), // YYYY-MM-DD
  announcementLink: text(),
  cancelledAt: integer({ mode: 'timestamp' }),

  // Wettkampf-Metadaten (competition + ladv)
  raceType: text('race_type').$type<'track' | 'road'>(),
  championshipType: text('championship_type').$type<'none' | 'bbm' | 'ndm' | 'dm'>(),
  isWrc: integer('is_wrc').notNull().default(0),
  priority: text().$type<'A' | 'B' | 'C'>(),

  // LADV-spezifische Felder
  ladvId: integer(),
  ladvData: text({ mode: 'json' }),
  ladvLastSync: integer({ mode: 'timestamp' }),

  createdBy: integer({ mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
  createdAt: integer({ mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer({ mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

// Anmeldungen zu Events
export const registrations = sqliteTable('registrations', {
  id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
  eventId: integer({ mode: 'number' }).notNull().references(() => events.id, { onDelete: 'cascade' }),
  userId: integer({ mode: 'number' }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text().notNull().$type<'registered' | 'canceled' | 'maybe' | 'yes' | 'no'>(),
  notes: text(),

  createdAt: integer({ mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer({ mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
}, t => [
  unique().on(t.eventId, t.userId),
])

// Disziplin-Einträge pro Anmeldung (nur bei type=ladv)
export const registrationDisciplines = sqliteTable('registration_disciplines', {
  id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
  registrationId: integer({ mode: 'number' }).notNull().references(() => registrations.id, { onDelete: 'cascade' }),
  discipline: text().notNull(),
  ageClass: text().notNull(),

  // LADV-Operationsfelder (pro Disziplin)
  ladvRegisteredAt: integer({ mode: 'timestamp' }),
  ladvRegisteredBy: integer({ mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
  ladvCanceledAt: integer({ mode: 'timestamp' }),
  ladvCanceledBy: integer({ mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),

  createdAt: integer({ mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
}, t => [
  unique().on(t.registrationId, t.discipline),
])

// Kommentare & Ankündigungen zu Events
export const eventComments = sqliteTable('event_comments', {
  id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
  eventId: integer({ mode: 'number' }).notNull().references(() => events.id, { onDelete: 'cascade' }),
  userId: integer({ mode: 'number' }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text().notNull().$type<'comment' | 'announcement'>(),
  body: text().notNull(),

  createdAt: integer({ mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer({ mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

// Emoji-Reaktionen auf Kommentare (Schema only, kein UI in v2)
export const reactions = sqliteTable('reactions', {
  id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
  commentId: integer({ mode: 'number' }).notNull().references(() => eventComments.id, { onDelete: 'cascade' }),
  userId: integer({ mode: 'number' }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  emoji: text().notNull(),

  createdAt: integer({ mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
}, t => [
  unique().on(t.commentId, t.userId, t.emoji),
])

// E-Mail-Log (F-19)
export const sentEmails = sqliteTable('sent_emails', {
  id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
  eventId: integer({ mode: 'number' }).references(() => events.id, { onDelete: 'set null' }),
  userId: integer({ mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
  type: text().notNull().$type<
    'registration'
    | 'cancellation'
    | 'ladv_registered'
    | 'ladv_canceled'
    | 'urgent_registration'
    | 'reminder_athlete'
    | 'reminder_admin'
    | 'event_reminder'
  >(),
  sentAt: integer({ mode: 'timestamp' }),
  error: text(),
})
