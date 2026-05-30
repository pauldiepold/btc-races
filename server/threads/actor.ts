import type { UserSessionRequired } from '#auth-utils'

/** Wer eine Thread-Operation auslöst — analog zum Event-/Anmelde-Modul. */
export type ActorKind = 'self' | 'admin'

export type ThreadActor = {
  kind: ActorKind
  userId: number
}

/**
 * Leitet den Aktor aus der Session ab. Admin/Superuser → `admin`, sonst `self`.
 * Die Unterscheidung admin vs. superuser ist HTTP-Auth-Concern und bleibt draußen.
 */
export function actorFromSession(session: UserSessionRequired): ThreadActor {
  const role = session.user.role
  if (role === 'admin' || role === 'superuser') {
    return { kind: 'admin', userId: session.user.id }
  }
  return { kind: 'self', userId: session.user.id }
}
