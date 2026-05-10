import { RegistrationError } from './errors'

export type Actor
  = | { kind: 'self', userId: number, hasLadvStartpass: boolean }
    | { kind: 'admin', userId: number }

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
