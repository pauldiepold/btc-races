import type { db as hubDb } from 'hub:db'
import { asc, count, eq } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'
import { encodeEventId } from '~~/server/utils/sqids'
import { memberSyncState, type MemberSyncState } from '~~/shared/utils/member-sync-state'

type AppDb = typeof hubDb

export type MemberAdminOverviewItem = {
  id: number
  firstName: string | null
  lastName: string | null
  email: string
  avatarUrl: string | null
  role: 'member' | 'admin' | 'superuser'
  membershipStatus: 'active' | 'inactive' | null
  membershipNumber: string | null
  sections: string[] | null
  hasLadvStartpass: boolean
  syncState: MemberSyncState
  lastSyncedAt: string | null
  pushDeviceCount: number
  registrationCount: number
}

export async function getMemberAdminOverview(
  db: AppDb,
  now: Date,
): Promise<MemberAdminOverviewItem[]> {
  const users = await db
    .select()
    .from(schema.users)
    .orderBy(asc(schema.users.lastName), asc(schema.users.firstName))

  const pushRows = await db
    .select({ userId: schema.pushSubscriptions.userId, n: count() })
    .from(schema.pushSubscriptions)
    .groupBy(schema.pushSubscriptions.userId)
  const pushByUser = new Map(pushRows.map(r => [r.userId, r.n]))

  const regRows = await db
    .select({ userId: schema.registrations.userId, n: count() })
    .from(schema.registrations)
    .groupBy(schema.registrations.userId)
  const regByUser = new Map(regRows.map(r => [r.userId, r.n]))

  return users.map(u => ({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    avatarUrl: u.avatarSmall ? `/api/avatar/${u.id}` : null,
    role: u.role ?? 'member',
    membershipStatus: u.membershipStatus,
    membershipNumber: u.membershipNumber,
    sections: u.sections,
    hasLadvStartpass: u.hasLadvStartpass === 1,
    syncState: memberSyncState({ campaiId: u.campaiId, lastSyncedAt: u.lastSyncedAt }, now),
    lastSyncedAt: u.lastSyncedAt ? u.lastSyncedAt.toISOString() : null,
    pushDeviceCount: pushByUser.get(u.id) ?? 0,
    registrationCount: regByUser.get(u.id) ?? 0,
  }))
}

export type MemberRegistrationItem = {
  eventId: number
  eventSlug: string
  eventName: string
  eventDate: string | null
  status: string
}

export async function getMemberRegistrations(
  db: AppDb,
  userId: number,
): Promise<MemberRegistrationItem[]> {
  const rows = await db
    .select({
      eventId: schema.events.id,
      eventName: schema.events.name,
      eventDate: schema.events.date,
      status: schema.registrations.status,
    })
    .from(schema.registrations)
    .innerJoin(schema.events, eq(schema.registrations.eventId, schema.events.id))
    .where(eq(schema.registrations.userId, userId))
    .orderBy(asc(schema.events.date))

  return rows.map(r => ({ ...r, eventSlug: encodeEventId(r.eventId) }))
}
