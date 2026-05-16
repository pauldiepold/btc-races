import type { UserSessionRequired } from '#auth-utils'

export type EventActor
  = | { kind: 'self', userId: number }
    | { kind: 'admin', userId: number }

export function selfActor(session: UserSessionRequired): EventActor {
  return { kind: 'self', userId: session.user.id }
}

export function adminActor(session: UserSessionRequired): EventActor {
  return { kind: 'admin', userId: session.user.id }
}

export function actorFromSession(session: UserSessionRequired): EventActor {
  const role = session.user.role
  if (role === 'admin' || role === 'superuser') {
    return { kind: 'admin', userId: session.user.id }
  }
  return { kind: 'self', userId: session.user.id }
}
