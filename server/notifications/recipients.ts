import { and, eq, inArray } from 'drizzle-orm'
import { ladvDisciplineLabel, ladvAgeClassLabel } from '~~/shared/utils/ladv-labels'
import type { RegistrationDisciplinePair } from '~~/shared/types/db'

export interface NotificationRecipient {
  userId: number
  email?: string
  firstName?: string
  /** Recipient-spezifische Disziplinen-Liste (z.B. für reminder_deadline_athlete). */
  disciplines?: string[]
}

export type RegistrationStatus = 'registered' | 'canceled' | 'maybe' | 'yes' | 'no'

export interface RegisteredForOptions {
  /** Welche Registration-Status zählen. Default: ['registered','yes']. */
  statuses?: readonly RegistrationStatus[]
  /** Nur User mit membershipStatus='active' einbeziehen. Default: false. */
  activeMembersOnly?: boolean
  /** Disziplinen-Liste pro Recipient anhängen (für reminder_deadline_athlete). Default: false. */
  withDisciplines?: boolean
}

const DEFAULT_REGISTERED_STATUSES: readonly RegistrationStatus[] = ['registered', 'yes']

/**
 * Wiederverwendbare Recipient-Resolver für `notify()`.
 *
 * Bündelt die wiederkehrenden DB-Queries für Notification-Empfänger,
 * sodass Schema- oder Filter-Änderungen nur an einer Stelle gepflegt werden.
 */
export const recipients = {
  /**
   * Alle aktiven Admins/Superuser.
   */
  async allAdmins(): Promise<NotificationRecipient[]> {
    const { db, schema } = await import('hub:db')
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
   * Alle aktiven Mitglieder.
   */
  async allMembers(): Promise<NotificationRecipient[]> {
    const { db, schema } = await import('hub:db')
    const rows = await db.select({
      userId: schema.users.id,
      email: schema.users.email,
      firstName: schema.users.firstName,
    })
      .from(schema.users)
      .where(eq(schema.users.membershipStatus, 'active'))

    return rows.map(r => ({ userId: r.userId, email: r.email, firstName: r.firstName ?? undefined }))
  },

  /**
   * Alle für ein Event angemeldeten User.
   *
   * Default-Filter: Status `registered` oder `yes`. Über `options` lässt sich
   * der Status-Filter erweitern, ein Membership-Filter ergänzen oder die
   * Wunsch-Disziplinen pro Recipient anhängen.
   */
  async registeredFor(eventId: number, options: RegisteredForOptions = {}): Promise<NotificationRecipient[]> {
    const { db, schema } = await import('hub:db')
    const statuses = options.statuses ?? DEFAULT_REGISTERED_STATUSES

    const conditions = [
      eq(schema.registrations.eventId, eventId),
      inArray(schema.registrations.status, [...statuses]),
    ]
    if (options.activeMembersOnly) {
      conditions.push(eq(schema.users.membershipStatus, 'active'))
    }

    const rows = await db.select({
      userId: schema.users.id,
      email: schema.users.email,
      firstName: schema.users.firstName,
      wishDisciplines: schema.registrations.wishDisciplines,
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
        const disciplines = wish.map(d => `${ladvDisciplineLabel(d.discipline)} (${ladvAgeClassLabel(d.ageClass)})`)
        if (disciplines.length > 0) recipient.disciplines = disciplines
      }
      return recipient
    })
  },

  /**
   * Einzelner User per ID. Liefert `[]`, wenn der User nicht existiert.
   */
  async user(userId: number): Promise<NotificationRecipient[]> {
    const { db, schema } = await import('hub:db')
    const row = await db.query.users.findFirst({
      where: eq(schema.users.id, userId),
      columns: { id: true, email: true, firstName: true },
    })
    if (!row) return []
    return [{ userId: row.id, email: row.email, firstName: row.firstName ?? undefined }]
  },
}
