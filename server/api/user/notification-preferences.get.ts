import { buildPreferencesResponse } from '~~/server/notifications/preferences'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const userId = session.user.id
  const role = session.user.role
  const isAdmin = role === 'admin' || role === 'superuser'

  return buildPreferencesResponse(userId, isAdmin)
})
