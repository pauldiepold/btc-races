import type { UserSessionRequired } from '#auth-utils'
import { RegistrationError } from './errors'

export type Actor
  = | { kind: 'self', userId: number, hasLadvStartpass: boolean }
    | { kind: 'admin', userId: number }

export function selfActor(session: UserSessionRequired): Actor {
  return {
    kind: 'self',
    userId: session.user.id,
    hasLadvStartpass: !!session.user.hasLadvStartpass,
  }
}

export function adminActor(session: UserSessionRequired): Actor {
  return { kind: 'admin', userId: session.user.id }
}

export function actorFromSession(session: UserSessionRequired): Actor {
  const role = session.user.role
  if (role === 'admin' || role === 'superuser') {
    return { kind: 'admin', userId: session.user.id }
  }
  return {
    kind: 'self',
    userId: session.user.id,
    hasLadvStartpass: !!session.user.hasLadvStartpass,
  }
}

export function assertSelfOwnsRegistration(
  actor: Actor,
  registration: { userId: number },
): void {
  if (actor.kind === 'self' && registration.userId !== actor.userId) {
    throw new RegistrationError('forbidden')
  }
}

export function assertAdmin(
  actor: Actor,
): asserts actor is { kind: 'admin', userId: number } {
  if (actor.kind !== 'admin') {
    throw new RegistrationError('forbidden')
  }
}
