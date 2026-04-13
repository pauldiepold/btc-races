import { db, schema } from 'hub:db'
import { eq, and, gt } from 'drizzle-orm'

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

  // 3. Session setzen
  await setUserSession(event, {
    user: {
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
    },
    loggedInAt: new Date().toISOString(),
  })

  // 4. Token löschen
  await db.delete(schema.authTokens).where(eq(schema.authTokens.token, token))

  // 5. Weiterleiten
  return sendRedirect(event, redirectTo)
})
