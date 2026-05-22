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

/** Thread mit Kommentaranzahl — Listendarstellung in den Räumen. */
export type ThreadListItem = Thread & { commentCount: number }
