import type { ThreadActor } from './actor'
import { ROOMS, type Room } from './rooms'

/**
 * Darf der Aktor in diesem Raum einen Beitrag anlegen?
 * Ankündigungen nur Admin, die übrigen Räume jedes (aktive) Mitglied.
 */
export function canCreateThread(actor: ThreadActor, room: Room): boolean {
  return room.allowedCreatorRoles.includes(actor.kind)
}

/** Darf der Aktor in mindestens einem Raum anlegen? Steuert die „Neuer Beitrag"-Sichtbarkeit. */
export function canCreateInAnyRoom(actor: ThreadActor): boolean {
  return ROOMS.some(room => canCreateThread(actor, room))
}
