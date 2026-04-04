function isAdminOrSuperuser(role: 'member' | 'admin' | 'superuser'): boolean {
  return role === 'admin' || role === 'superuser'
}

export async function requireAdmin(event: Parameters<typeof requireUserSession>[0]) {
  const session = await requireUserSession(event)
  if (!isAdminOrSuperuser(session.user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Keine Berechtigung.' })
  }
  return session
}

export async function requireSuperuser(event: Parameters<typeof requireUserSession>[0]) {
  const session = await requireUserSession(event)
  if (session.user.role !== 'superuser') {
    throw createError({ statusCode: 403, statusMessage: 'Keine Berechtigung.' })
  }
  return session
}

export async function requireOwnerOrAdmin(
  event: Parameters<typeof requireUserSession>[0],
  ownerId: string,
) {
  const session = await requireUserSession(event)
  if (session.user.id !== ownerId && !isAdminOrSuperuser(session.user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Keine Berechtigung.' })
  }
  return session
}
