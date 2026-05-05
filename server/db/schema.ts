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
  raceType: text('race_type').$type<'track' | 'road' | 'trail'>(),
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
  wishDisciplines: text({ mode: 'json' }).$type<import('~~/shared/types/db').RegistrationDisciplinePair[]>().notNull().default(sql`'[]'`),
  ladvDisciplines: text({ mode: 'json' }).$type<import('~~/shared/types/db').RegistrationDisciplinePair[] | null>(),

  createdAt: integer({ mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer({ mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
}, t => [
  unique().on(t.eventId, t.userId),
])

// Notification-Jobs (Queue + Log)
export const notificationJobs = sqliteTable('notification_jobs', {
  id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
  type: text().notNull().$type<import('~~/shared/types/notifications').NotificationType>(),
  status: text().notNull().$type<'pending' | 'processing' | 'done' | 'failed'>().default('pending'),
  payload: text().notNull(), // JSON
  actorUserId: integer({ mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
  attempts: integer().notNull().default(0),
  error: text(),
  createdAt: integer({ mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  processedAt: integer({ mode: 'timestamp' }),
})

// Notification-Zustellungen (pro Empfänger + Kanal)
export const notificationDeliveries = sqliteTable('notification_deliveries', {
  id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
  jobId: integer({ mode: 'number' }).notNull().references(() => notificationJobs.id, { onDelete: 'cascade' }),
  channel: text().notNull().$type<import('~~/shared/types/notifications').NotificationChannel>(),
  recipientId: integer({ mode: 'number' }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text().notNull().$type<'sent' | 'failed'>(),
  error: text(),
  sentAt: integer({ mode: 'timestamp' }),
})

// Notification-Preferences (User-Overrides, Defaults im Code)
export const notificationPreferences = sqliteTable('notification_preferences', {
  id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
  userId: integer({ mode: 'number' }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  notificationType: text().notNull().$type<import('~~/shared/types/notifications').NotificationType>(),
  channel: text().notNull().$type<import('~~/shared/types/notifications').NotificationChannel>(),
  enabled: integer().notNull(),
}, t => [
  unique().on(t.userId, t.notificationType, t.channel),
])

// Web-Push-Subscriptions
export const pushSubscriptions = sqliteTable('push_subscriptions', {
  id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
  userId: integer({ mode: 'number' }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  endpoint: text().notNull(),
  keysAuth: text().notNull(),
  keysP256dh: text().notNull(),
  deviceHint: text().$type<'iOS' | 'Android' | 'Desktop'>(),
  createdAt: integer({ mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
}, t => [
  unique().on(t.userId, t.endpoint),
])
