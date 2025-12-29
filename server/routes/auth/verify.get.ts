import { db, schema } from 'hub:db'
import { eq, and, gt } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const token = query.token as string

  if (!token) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Token is missing',
    })
  }

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

  // 3. Session setzen
  await setUserSession(event, {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      role: user.role ?? '',
      sections: user.sections ?? [],
    },
    loggedInAt: new Date().toISOString(),
  })

  // 4. Token löschen (Single-Use)
  await db.delete(schema.authTokens).where(eq(schema.authTokens.token, token))

  // 5. Weiterleiten
  return sendRedirect(event, '/')
})
