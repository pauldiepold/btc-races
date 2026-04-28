import { db, schema } from 'hub:db'
import { asc, eq } from 'drizzle-orm'
import { requireAdmin } from '~~/server/utils/auth'

export type AdminMemberListItem = {
  id: number
  firstName: string | null
  lastName: string | null
  email: string
  hasAvatar: boolean
}

export default defineEventHandler(async (event): Promise<AdminMemberListItem[]> => {
  await requireAdmin(event)

  const rows = await db
    .select({
      id: schema.users.id,
      firstName: schema.users.firstName,
      lastName: schema.users.lastName,
      email: schema.users.email,
      avatarUrl: schema.users.avatarUrl,
    })
    .from(schema.users)
    .where(eq(schema.users.membershipStatus, 'active'))
    .orderBy(asc(schema.users.lastName), asc(schema.users.firstName))

  return rows.map(r => ({
    id: r.id,
    firstName: r.firstName,
    lastName: r.lastName,
    email: r.email,
    hasAvatar: r.avatarUrl !== null,
  }))
})
