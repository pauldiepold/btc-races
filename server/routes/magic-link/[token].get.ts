import { db, schema } from 'hub:db'
import { kv } from 'hub:kv'
import { eq, and, gt } from 'drizzle-orm'
import type { User } from '#auth-utils'

const CLAIM_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  const query = getQuery(event)

  if (!token) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Token fehlt.',
    })
  }

  const rawRedirect = query.redirect as string | undefined
  const redirectTo = rawRedirect?.startsWith('/') && !rawRedirect.startsWith('//')
    ? rawRedirect
    : '/'

  const rawClaim = query.claim as string | undefined
  const claimId = rawClaim && CLAIM_ID_PATTERN.test(rawClaim) ? rawClaim : undefined

  // 1. Token validieren
  const authToken = await db.query.authTokens.findFirst({
    where: and(
      eq(schema.authTokens.token, token),
      gt(schema.authTokens.expiresAt, new Date()),
    ),
  })

  if (!authToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Ungültiger oder abgelaufener Token.',
    })
  }

  // 2. User laden
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, authToken.userId),
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User nicht gefunden.',
    })
  }

  if (user.membershipStatus !== 'active') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Deine Mitgliedschaft ist nicht aktiv. Bitte wende dich an den BTC.',
    })
  }

  // 3. Session-Objekt vorbereiten (wird in dieser Instanz gesetzt UND optional
  // in der Claim abgelegt, damit die PWA die Session per Polling übernehmen kann)
  const sessionUser: User = {
    id: user.id,
    email: user.email,
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    role: user.role ?? 'member',
    sections: user.sections ?? [],
    hasAvatar: !!user.avatarSmall,
    hasLadvStartpass: user.hasLadvStartpass === 1,
    birthYear: user.birthday ? new Date(user.birthday).getFullYear() : null,
    gender: user.gender ?? null,
  }
  const loggedInAt = new Date().toISOString()

  await setUserSession(event, { user: sessionUser, loggedInAt })

  // 4. Token löschen
  await db.delete(schema.authTokens).where(eq(schema.authTokens.token, token))

  // 5. Claim für PWA-Polling markieren, falls vorhanden
  if (claimId) {
    await kv.setItem(
      `authclaim:${claimId}`,
      { status: 'ready', user: sessionUser, loggedInAt, redirectTo },
      { ttl: 5 * 60 },
    )
    // Safari (oder der Browser, der den Link geöffnet hat) landet auf einer
    // Bestätigungsseite mit Hinweis, zur App zurückzuwechseln.
    return sendRedirect(event, '/anmeldung-bestaetigt')
  }

  // 6. Weiterleiten (klassischer Flow)
  return sendRedirect(event, redirectTo)
})
