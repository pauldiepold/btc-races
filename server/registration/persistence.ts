import { and, eq } from 'drizzle-orm'
import type { db as hubDb } from 'hub:db'
import * as schema from '~~/server/db/schema'
import type { RegistrationDisciplinePair } from '~~/shared/types/db'
import type { RegistrationStatus } from '~~/shared/utils/registration'

export type AppDb = typeof hubDb

export type EventRow = typeof schema.events.$inferSelect
export type UserRow = typeof schema.users.$inferSelect
export type RegistrationRow = typeof schema.registrations.$inferSelect

export function loadEventById(db: AppDb, id: number): Promise<EventRow | undefined> {
  return db.query.events.findFirst({ where: eq(schema.events.id, id) })
}

export function loadUserById(db: AppDb, id: number): Promise<UserRow | undefined> {
  return db.query.users.findFirst({ where: eq(schema.users.id, id) })
}

export function loadRegistrationByEventUser(
  db: AppDb,
  eventId: number,
  userId: number,
): Promise<RegistrationRow | undefined> {
  return db.query.registrations.findFirst({
    where: and(
      eq(schema.registrations.eventId, eventId),
      eq(schema.registrations.userId, userId),
    ),
  })
}

export function loadRegistrationById(
  db: AppDb,
  id: number,
): Promise<RegistrationRow | undefined> {
  return db.query.registrations.findFirst({
    where: eq(schema.registrations.id, id),
  })
}

export type InsertRegistrationValues = {
  eventId: number
  userId: number
  status: RegistrationStatus
  notes: string | null
  wishDisciplines: RegistrationDisciplinePair[]
  ladvDisciplines: RegistrationDisciplinePair[] | null
}

export async function insertRegistration(
  db: AppDb,
  values: InsertRegistrationValues,
): Promise<number> {
  const inserted = await db.insert(schema.registrations).values(values).returning({ id: schema.registrations.id })
  return inserted[0]!.id
}

export type ReactivateRegistrationPatch = {
  status: RegistrationStatus
  notes: string | null
  wishDisciplines: RegistrationDisciplinePair[]
  ladvDisciplines?: RegistrationDisciplinePair[]
}

export async function reactivateRegistration(
  db: AppDb,
  id: number,
  patch: ReactivateRegistrationPatch,
): Promise<void> {
  await db.update(schema.registrations)
    .set({
      status: patch.status,
      notes: patch.notes,
      wishDisciplines: patch.wishDisciplines,
      ...(patch.ladvDisciplines !== undefined ? { ladvDisciplines: patch.ladvDisciplines } : {}),
    })
    .where(eq(schema.registrations.id, id))
}

export async function updateRegistrationStatusField(
  db: AppDb,
  id: number,
  status: RegistrationStatus,
): Promise<void> {
  await db.update(schema.registrations)
    .set({ status })
    .where(eq(schema.registrations.id, id))
}

export async function updateRegistrationNotesField(
  db: AppDb,
  id: number,
  notes: string | null,
): Promise<void> {
  await db.update(schema.registrations)
    .set({ notes })
    .where(eq(schema.registrations.id, id))
}

export type RegistrationDisciplinesPatch = {
  wishDisciplines?: RegistrationDisciplinePair[]
  ladvDisciplines?: RegistrationDisciplinePair[] | null
}

export async function updateRegistrationDisciplines(
  db: AppDb,
  id: number,
  patch: RegistrationDisciplinesPatch,
): Promise<void> {
  await db.update(schema.registrations)
    .set({
      ...(patch.wishDisciplines !== undefined ? { wishDisciplines: patch.wishDisciplines } : {}),
      ...(patch.ladvDisciplines !== undefined ? { ladvDisciplines: patch.ladvDisciplines } : {}),
    })
    .where(eq(schema.registrations.id, id))
}
