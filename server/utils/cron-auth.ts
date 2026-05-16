import type { H3Event } from 'h3'

export function requireCronAuth(event: H3Event): void {
  const config = useRuntimeConfig(event)
  const authHeader = getHeader(event, 'Authorization')
  if (authHeader !== `Bearer ${config.cronToken}`) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
}
