import { and, asc, desc, eq, gte, inArray, isNull, sql } from 'drizzle-orm'
import type { db as hubDb } from 'hub:db'
import * as schema from '~~/server/db/schema'
import type { RoomSlug } from '~~/shared/types/threads'

export type AppDb = typeof hubDb

export type ThreadRow = typeof schema.threads.$inferSelect
export type ThreadInsert = typeof schema.threads.$inferInsert

export type EventRow = typeof schema.events.$inferSelect

export type CommentRow = typeof schema.comments.$inferSelect
export type CommentInsert = typeof schema.comments.$inferInsert

export async function insertThread(db: AppDb, values: ThreadInsert): Promise<ThreadRow> {
  const [row] = await db.insert(schema.threads).values(values).returning()
  return row!
}

/** Eine einzelne Thread-Row per ID, oder `undefined`. */
export function findThreadById(db: AppDb, id: number): Promise<ThreadRow | undefined> {
  return db.query.threads.findFirst({ where: eq(schema.threads.id, id) })
}

/** Den Event-Thread eines Events finden, oder `undefined`. */
export function findThreadByEventId(db: AppDb, eventId: number): Promise<ThreadRow | undefined> {
  return db.query.threads.findFirst({ where: eq(schema.threads.eventId, eventId) })
}

/** Eine einzelne Event-Row per ID, oder `undefined`. */
export function findEventById(db: AppDb, id: number): Promise<EventRow | undefined> {
  return db.query.events.findFirst({ where: eq(schema.events.id, id) })
}

/** IDs aller Events, die noch keinen Event-Thread besitzen. */
export async function findEventIdsWithoutThread(db: AppDb): Promise<number[]> {
  const rows = await db
    .select({ id: schema.events.id })
    .from(schema.events)
    .leftJoin(schema.threads, eq(schema.threads.eventId, schema.events.id))
    .where(isNull(schema.threads.eventId))
  return rows.map(r => r.id)
}

export async function insertComment(db: AppDb, values: CommentInsert): Promise<CommentRow> {
  const [row] = await db.insert(schema.comments).values(values).returning()
  return row!
}

/**
 * Kommentare eines Threads, älteste zuerst (Chat-Reihenfolge). `since` grenzt
 * auf Kommentare ab diesem Zeitpunkt ein (Delta-Polling). Bewusst `gte` statt
 * `gt`: Timestamps haben Sekunden-Auflösung (`unixepoch`); bei `gt` würde ein
 * zweiter Kommentar derselben Sekunde dauerhaft durchs Polling-Fenster fallen.
 * Den Randkommentar gibt es dadurch doppelt — `mergeComments` dedupliziert per `id`.
 */
export function listCommentRows(db: AppDb, threadId: number, since?: Date): Promise<CommentRow[]> {
  return db.query.comments.findMany({
    where: since
      ? and(eq(schema.comments.threadId, threadId), gte(schema.comments.createdAt, since))
      : eq(schema.comments.threadId, threadId),
    orderBy: asc(schema.comments.createdAt),
  })
}

/** Kommentaranzahl je Thread für die gegebenen IDs (Threads ohne Kommentare fehlen in der Map). */
export async function countCommentsByThread(
  db: AppDb,
  threadIds: number[],
): Promise<Map<number, number>> {
  if (threadIds.length === 0) return new Map()
  const rows = await db
    .select({
      threadId: schema.comments.threadId,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(schema.comments)
    .where(inArray(schema.comments.threadId, threadIds))
    .groupBy(schema.comments.threadId)
  return new Map(rows.map(r => [r.threadId, r.count]))
}

/** Setzt den denormalisierten Sort-Key `lastActivityAt` eines Threads. */
export async function touchThreadActivity(db: AppDb, threadId: number, at: Date): Promise<void> {
  await db
    .update(schema.threads)
    .set({ lastActivityAt: at })
    .where(eq(schema.threads.id, threadId))
}

/** Setzt Titel und Body eines Threads. `lastActivityAt` bleibt unberührt. */
export async function updateThreadContent(
  db: AppDb,
  threadId: number,
  content: { title: string, body: string },
): Promise<void> {
  await db
    .update(schema.threads)
    .set({ title: content.title, body: content.body })
    .where(eq(schema.threads.id, threadId))
}

/** Setzt `deletedAt` (Soft-Delete) auf einem Thread. */
export async function softDeleteThread(db: AppDb, threadId: number, at: Date): Promise<void> {
  await db
    .update(schema.threads)
    .set({ deletedAt: at })
    .where(eq(schema.threads.id, threadId))
}

/** Eine einzelne Comment-Row per ID, oder `undefined`. */
export function findCommentById(db: AppDb, id: number): Promise<CommentRow | undefined> {
  return db.query.comments.findFirst({ where: eq(schema.comments.id, id) })
}

/** Setzt den Body eines Kommentars; `updatedAt` aktualisiert Drizzle automatisch. */
export async function updateCommentBody(db: AppDb, commentId: number, body: string): Promise<void> {
  await db
    .update(schema.comments)
    .set({ body })
    .where(eq(schema.comments.id, commentId))
}

/** Setzt `deletedAt` (Soft-Delete / Tombstone) auf einem Kommentar. */
export async function softDeleteComment(db: AppDb, commentId: number, at: Date): Promise<void> {
  await db
    .update(schema.comments)
    .set({ deletedAt: at })
    .where(eq(schema.comments.id, commentId))
}

/**
 * Setzt oder entfernt den Pin-Status eines Kommentars. `null` heftet ab.
 * `keepUpdatedAt` bewahrt das bestehende `updatedAt` — sonst würde Drizzles
 * `$onUpdateFn` es anheben und der Kommentar im UI fälschlich „(bearbeitet)"
 * zeigen (Pinnen ist kein Edit).
 */
export async function setCommentPin(
  db: AppDb,
  commentId: number,
  pin: { at: Date, by: number } | null,
  keepUpdatedAt: Date,
): Promise<void> {
  await db
    .update(schema.comments)
    .set({
      pinnedAt: pin?.at ?? null,
      pinnedBy: pin?.by ?? null,
      updatedAt: keepUpdatedAt,
    })
    .where(eq(schema.comments.id, commentId))
}

/** Anzahl aktuell angehefteter (nicht gelöschter) Kommentare eines Threads. */
export async function countPinnedComments(db: AppDb, threadId: number): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(schema.comments)
    .where(
      and(
        eq(schema.comments.threadId, threadId),
        isNull(schema.comments.deletedAt),
        sql`${schema.comments.pinnedAt} is not null`,
      ),
    )
  return row?.count ?? 0
}

/** Eine Listen-Row inkl. optionaler Event-Metadaten für Event-Threads. */
export type ThreadListRow = ThreadRow & {
  event: { id: number, name: string, date: string | null, location: string | null } | null
}

/**
 * Nicht gelöschte Threads, neueste Aktivität zuerst. Optional auf einen Raum
 * gefiltert. Liefert sowohl Beiträge als auch Event-Threads — bei Event-Threads
 * werden Name/Datum/Ort des Events mit zurückgegeben.
 */
export async function listThreadRows(db: AppDb, roomSlug?: RoomSlug): Promise<ThreadListRow[]> {
  const base = isNull(schema.threads.deletedAt)
  const rows = await db
    .select({
      thread: schema.threads,
      event: {
        id: schema.events.id,
        name: schema.events.name,
        date: schema.events.date,
        location: schema.events.location,
      },
    })
    .from(schema.threads)
    .leftJoin(schema.events, eq(schema.events.id, schema.threads.eventId))
    .where(roomSlug ? and(base, eq(schema.threads.roomSlug, roomSlug)) : base)
    .orderBy(desc(schema.threads.lastActivityAt))

  return rows.map(r => ({
    ...r.thread,
    event: r.event && r.event.id !== null ? r.event : null,
  }))
}
