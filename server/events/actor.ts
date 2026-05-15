export type EventActor
  = | { kind: 'owner', userId: number }
    | { kind: 'admin', userId: number, isSuperuser: boolean }

export function isAdminActor(
  actor: EventActor,
): actor is { kind: 'admin', userId: number, isSuperuser: boolean } {
  return actor.kind === 'admin'
}
