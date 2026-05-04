import { eq, inArray } from 'drizzle-orm'

export interface NotificationRecipient {
  userId: number
  email?: string
  firstName?: string
  /** Recipient-spezifische Disziplinen-Liste (z.B. für reminder_deadline_athlete). */
  disciplines?: string[]
}

/**
 * Wiederverwendbare Recipient-Resolver für `notify()`.
 *
 * Gedacht als minimaler Sammelpunkt — größere Resolver folgen mit Issue #159.
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
}
