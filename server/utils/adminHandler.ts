import type { EventHandler, EventHandlerRequest } from 'h3'

export const defineAdminHandler = <T extends EventHandlerRequest, D>(
  handler: EventHandler<T, D>,
): EventHandler<T, D> =>
  defineEventHandler<T>(async (event) => {
    const { user } = await getUserSession(event)

    const adminEmails = (process.env.NUXT_ADMIN_EMAILS || '').split(',')
    const isHardcodedAdmin = !!(user?.email && adminEmails.includes(user.email))
    const isDbAdmin = user?.role === 'admin'

    if (!isHardcodedAdmin && !isDbAdmin) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Unauthorized: Administrator access required.',
      })
    }

    return handler(event)
  })
