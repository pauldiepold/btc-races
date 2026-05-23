import type { schema } from 'hub:db'

/**
 * Kanonische Raum-Slugs — SSOT für den `roomSlug`-Typ. Reihenfolge = Tab-Reihenfolge
 * im UI. Die vollständige Raum-Konfiguration (Titel, Anlage-Rechte, mandatory)
 * liegt in `server/threads/rooms.ts`.
 */
export const ROOM_SLUGS = ['announcements', 'training', 'team', 'races', 'social'] as const

export type RoomSlug = typeof ROOM_SLUGS[number]

/** Eine Thread-Row aus der DB — Beitrag (`eventId` null) oder Event-Thread. */
export type Thread = typeof schema.threads.$inferSelect

/** Eine Kommentar-Row aus der DB. */
export type Comment = typeof schema.comments.$inferSelect

/** Kommentar mit aufgelöstem Autor-Anzeigenamen — für die Chat-Darstellung. */
export type CommentWithAuthor = Comment & { authorName: string | null }

/**
 * In der Liste gezeigte Event-Daten eines Event-Threads. `null` bei Beiträgen.
 * Titel/Datum/Ort stammen direkt aus dem Event (Single Source of Truth).
 */
export type ThreadListEvent = {
  id: number
  name: string
  date: string | null
  location: string | null
}

/** Thread mit Kommentaranzahl und (bei Event-Threads) Event-Metadaten. */
export type ThreadListItem = Thread & {
  commentCount: number
  event: ThreadListEvent | null
}
