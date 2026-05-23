import { and, asc, desc, eq, gt, inArray, isNull, sql } from 'drizzle-orm'
import type { db as hubDb } from 'hub:db'
import * as schema from '~~/server/db/schema'
import type { RoomSlug } from '~~/shared/types/threads'

export type AppDb = typeof hubDb

export type ThreadRow = typeof schema.threads.$inferSelect
export type ThreadInsert = typeof schema.threads.$inferInsert

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

export async function insertComment(db: AppDb, values: CommentInsert): Promise<CommentRow> {
  const [row] = await db.insert(schema.comments).values(values).returning()
  return row!
}

/**
 * Kommentare eines Threads, älteste zuerst (Chat-Reihenfolge). `since` grenzt
 * auf Kommentare ein, die nach dem Zeitpunkt erstellt wurden (Delta-Polling).
 */
export function listCommentRows(db: AppDb, threadId: number, since?: Date): Promise<CommentRow[]> {
  return db.query.comments.findMany({
    where: since
      ? and(eq(schema.comments.threadId, threadId), gt(schema.comments.createdAt, since))
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
 * Nicht gelöschte Threads, neueste Aktivität zuerst. Optional auf einen Raum
 * gefiltert.
 */
export function listThreadRows(db: AppDb, roomSlug?: RoomSlug): Promise<ThreadRow[]> {
  return db.query.threads.findMany({
    where: roomSlug
      ? and(isNull(schema.threads.deletedAt), eq(schema.threads.roomSlug, roomSlug))
      : isNull(schema.threads.deletedAt),
    orderBy: desc(schema.threads.lastActivityAt),
  })
}
