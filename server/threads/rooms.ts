import type { RoomSlug } from '~~/shared/types/threads'
import type { ActorKind } from './actor'

/**
 * Ein Raum gruppiert Threads. Statisch im Code definiert — kein Admin-UI.
 * `allowedCreatorRoles` führt die Aktor-Arten, die hier Beiträge anlegen dürfen.
 */
export type Room = {
  slug: RoomSlug
  title: string
  allowedCreatorRoles: ActorKind[]
  mandatory: boolean
}

/** Die fünf Vereinsräume. Reihenfolge = Tab-Reihenfolge im UI. */
export const ROOMS: readonly Room[] = [
  { slug: 'announcements', title: 'Ankündigungen', allowedCreatorRoles: ['admin'], mandatory: true },
  { slug: 'training', title: 'Training', allowedCreatorRoles: ['self', 'admin'], mandatory: false },
  { slug: 'team', title: 'Team', allowedCreatorRoles: ['self', 'admin'], mandatory: false },
  { slug: 'races', title: 'Races', allowedCreatorRoles: ['self', 'admin'], mandatory: false },
  { slug: 'social', title: 'Social', allowedCreatorRoles: ['self', 'admin'], mandatory: false },
]

/** Liefert die Raum-Konfiguration zu einem Slug, oder `undefined` bei unbekanntem Slug. */
export function getRoom(slug: string): Room | undefined {
  return ROOMS.find(room => room.slug === slug)
}
