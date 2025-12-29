import type { H3Event, } from 'h3'
import type { User, } from '#auth-utils'

/**
 * Prüft, ob ein User eine bestimmte Section hat
 */
export function hasSection(user: User, sectionName: string,): boolean {
  return user.sections.includes(sectionName,)
}

/**
 * Prüft, ob ein User mindestens eine der angegebenen Sections hat
 */
export function hasAnySection(user: User, sectionNames: string[],): boolean {
  return sectionNames.some(name => user.sections.includes(name,),)
}

/**
 * Middleware/Guard für API-Endpunkte: Fordert eine bestimmte Section
 *
 * Usage in API-Route:
 * ```ts
 * export default defineEventHandler(async (event) => {
 *   await requireSection(event, 'Vorstand')
 *   // ... Rest der Logik
 * })
 * ```
 */
export async function requireSection(event: H3Event, sectionName: string,) {
  const userSession = await requireUserSession(event,)

  if (!hasSection(userSession.user, sectionName,)) {
    throw createError({
      statusCode: 403,
      message: `Zugriff verweigert. Section "${sectionName}" erforderlich.`,
    },)
  }
}

/**
 * Middleware/Guard: Fordert mindestens eine der angegebenen Sections
 */
export async function requireAnySection(event: H3Event, sectionNames: string[],) {
  const userSession = await requireUserSession(event,)

  if (!hasAnySection(userSession.user, sectionNames,)) {
    throw createError({
      statusCode: 403,
      message: `Zugriff verweigert. Eine dieser Sections erforderlich: ${sectionNames.join(', ',)}`,
    },)
  }
}
