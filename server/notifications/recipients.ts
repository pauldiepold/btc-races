import { and, eq, inArray } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'
import { buildDisciplineStatusList } from '~~/shared/utils/ladv-diff'
import type { DisciplineStatusItem } from '~~/shared/utils/ladv-diff'
import type { RegistrationDisciplinePair } from '~~/shared/types/db'
import type { NotifyDb } from './service'

async function resolveDb(override?: NotifyDb): Promise<NotifyDb> {
  if (override) return override
  const mod = await import('hub:db')
  return mod.db
}

export interface NotificationRecipient {
  userId: number
  email?: string
  firstName?: string
  /**
   * Recipient-spezifische Disziplinen-Liste inkl. LADV-Meldestatus
   * (z. B. für reminder_deadline_athlete, reminder_event).
   */
  disciplines?: DisciplineStatusItem[]
}

export type RegistrationStatus = 'registered' | 'canceled' | 'maybe' | 'yes' | 'no'

export interface RegisteredForOptions {
  /** Welche Registration-Status zählen. Default: ['registered','yes']. */
  statuses?: readonly RegistrationStatus[]
  /** Disziplinen-Liste pro Recipient anhängen (für reminder_deadline_athlete). Default: false. */
  withDisciplines?: boolean
}

const DEFAULT_REGISTERED_STATUSES: readonly RegistrationStatus[] = ['registered', 'yes']

/**
 * Wiederverwendbare Recipient-Resolver für `notify()`.
 *
 * Bündelt die wiederkehrenden DB-Queries für Notification-Empfänger,
 * sodass Schema- oder Filter-Änderungen nur an einer Stelle gepflegt werden.
 *
 * Die Resolver filtern bewusst NICHT nach Mitgliedsstatus — inaktive Mitglieder
 * werden zentral im Worker beim Versand ausgeschlossen (ADR-0003).
 */
export const recipients = {
  /**
   * Alle Admins/Superuser.
   */
  async allAdmins(dbOverride?: NotifyDb): Promise<NotificationRecipient[]> {
    const db = await resolveDb(dbOverride)
    const rows = await db.select({
      userId: schema.users.id,
      email: schema.users.email,
      firstName: schema.users.firstName,
    })
      .from(schema.users)
      .where(inArray(schema.users.role, ['admin', 'superuser']))

    return rows.map(r => ({ userId: r.userId, email: r.email, firstName: r.firstName ?? undefined }))
  },

  /**
   * Alle Mitglieder.
   */
  async allMembers(dbOverride?: NotifyDb): Promise<NotificationRecipient[]> {
    const db = await resolveDb(dbOverride)
    const rows = await db.select({
      userId: schema.users.id,
      email: schema.users.email,
      firstName: schema.users.firstName,
    })
      .from(schema.users)

    return rows.map(r => ({ userId: r.userId, email: r.email, firstName: r.firstName ?? undefined }))
  },

  /**
   * Alle für ein Event angemeldeten User.
   *
   * Default-Filter: Status `registered` oder `yes`. Über `options` lässt sich
   * der Status-Filter erweitern oder die Wunsch-Disziplinen pro Recipient
   * anhängen.
   */
  async registeredFor(
    eventId: number,
    options: RegisteredForOptions = {},
    dbOverride?: NotifyDb,
  ): Promise<NotificationRecipient[]> {
    const db = await resolveDb(dbOverride)
    const statuses = options.statuses ?? DEFAULT_REGISTERED_STATUSES

    const conditions = [
      eq(schema.registrations.eventId, eventId),
      inArray(schema.registrations.status, [...statuses]),
    ]

    const rows = await db.select({
      userId: schema.users.id,
      email: schema.users.email,
      firstName: schema.users.firstName,
      wishDisciplines: schema.registrations.wishDisciplines,
      ladvDisciplines: schema.registrations.ladvDisciplines,
    })
      .from(schema.registrations)
      .innerJoin(schema.users, eq(schema.registrations.userId, schema.users.id))
      .where(and(...conditions))

    return rows.map((row) => {
      const recipient: NotificationRecipient = {
        userId: row.userId,
        email: row.email,
        firstName: row.firstName ?? undefined,
      }
      if (options.withDisciplines) {
        const wish = (row.wishDisciplines as RegistrationDisciplinePair[] | null) ?? []
        const ladv = row.ladvDisciplines as RegistrationDisciplinePair[] | null
        const disciplines = buildDisciplineStatusList(wish, ladv)
        if (disciplines.length > 0) recipient.disciplines = disciplines
      }
      return recipient
    })
  },

  /**
   * Einzelner User per ID. Liefert `[]`, wenn der User nicht existiert.
   */
  async user(userId: number, dbOverride?: NotifyDb): Promise<NotificationRecipient[]> {
    const db = await resolveDb(dbOverride)
    const row = await db.query.users.findFirst({
      where: eq(schema.users.id, userId),
      columns: { id: true, email: true, firstName: true },
    })
    if (!row) return []
    return [{ userId: row.id, email: row.email, firstName: row.firstName ?? undefined }]
  },
}
