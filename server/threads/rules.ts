import type { Comment, Thread } from '~~/shared/types/threads'
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

/**
 * Darf der Aktor diesen Beitrag editieren? Nur Beiträge (`eventId === null`),
 * nicht soft-gelöscht, Autor oder Admin. Event-Threads haben keinen editierbaren
 * Titel/Body und sind ausgenommen.
 */
export function canEditThread(actor: ThreadActor, thread: Thread): boolean {
  if (thread.eventId !== null) return false
  if (thread.deletedAt !== null) return false
  return actor.kind === 'admin' || thread.createdBy === actor.userId
}

/**
 * Darf der Aktor diesen Beitrag (soft-)löschen? Identische Bedingungen wie
 * `canEditThread`: nur Beiträge, nicht bereits gelöscht, Autor oder Admin.
 */
export function canDeleteThread(actor: ThreadActor, thread: Thread): boolean {
  if (thread.eventId !== null) return false
  if (thread.deletedAt !== null) return false
  return actor.kind === 'admin' || thread.createdBy === actor.userId
}

/**
 * Darf der Aktor diesen Kommentar editieren? Nur der Autor — Admins können
 * fremde Kommentare löschen, aber nicht editieren (kein „Worte in den Mund
 * legen"). Ausgenommen sind soft-gelöschte Kommentare.
 */
export function canEditComment(actor: ThreadActor, comment: Comment): boolean {
  if (comment.deletedAt !== null) return false
  return comment.userId === actor.userId
}

/**
 * Darf der Aktor diesen Kommentar (soft-)löschen? Autor oder Admin,
 * außer bereits gelöscht.
 */
export function canDeleteComment(actor: ThreadActor, comment: Comment): boolean {
  if (comment.deletedAt !== null) return false
  return actor.kind === 'admin' || comment.userId === actor.userId
}

/**
 * Darf der Aktor diesen Kommentar an-/abheften? Admin oder Thread-Autor (bei
 * Event-Threads ist `thread.createdBy` der Event-Autor). Nicht bei
 * soft-gelöschten Kommentaren. Pin-Limit von 3 gilt nur beim Anheften
 * (`pinnedCount` zählt aktuell angeheftete Kommentare des Threads); ein bereits
 * angehefteter Kommentar darf immer abgeheftet werden.
 */
export function canPinComment(
  actor: ThreadActor,
  thread: Thread,
  comment: Comment,
  pinnedCount: number,
): boolean {
  if (comment.deletedAt !== null) return false
  const isAuthor = thread.createdBy !== null && thread.createdBy === actor.userId
  if (actor.kind !== 'admin' && !isAuthor) return false
  if (comment.pinnedAt !== null) return true
  return pinnedCount < 3
}
