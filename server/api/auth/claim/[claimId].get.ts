import { kv } from 'hub:kv'
import type { User } from '#auth-utils'

const RATE_LIMIT_MAX = 300
const RATE_LIMIT_TTL = 300 // 5 Minuten
const CLAIM_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface StoredClaim {
  status: 'pending' | 'ready'
  user?: User
  loggedInAt?: string
  redirectTo?: string
}

export default defineEventHandler(async (event) => {
  const claimId = getRouterParam(event, 'claimId')

  if (!claimId || !CLAIM_ID_PATTERN.test(claimId)) {
    throw createError({ statusCode: 400, message: 'Ungültige Claim-ID.' })
  }

  // Rate-Limit pro IP (Polling alle 2s → max. 150 Requests / 5 min pro Session;
  // Buffer auf 300 für mehrere offene Tabs oder kurzzeitig schnelleres Polling)
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  const rateLimitKey = `claim:ratelimit:${ip}`
  const now = Date.now()
  const record = await kv.getItem<{ count: number, resetAt: number }>(rateLimitKey)
  const isExpired = !record || now >= record.resetAt

  if (!isExpired && record!.count >= RATE_LIMIT_MAX) {
    throw createError({
      statusCode: 429,
      message: 'Zu viele Anfragen. Bitte versuche es später erneut.',
    })
  }

  if (isExpired) {
    await kv.setItem(rateLimitKey, { count: 1, resetAt: now + RATE_LIMIT_TTL * 1000 }, { ttl: RATE_LIMIT_TTL })
  }
  else {
    await kv.setItem(rateLimitKey, { count: record!.count + 1, resetAt: record!.resetAt }, { ttl: Math.ceil((record!.resetAt - now) / 1000) })
  }

  const key = `authclaim:${claimId}`
  const claim = await kv.getItem<StoredClaim>(key)

  if (!claim) {
    return { status: 'expired' as const }
  }

  if (claim.status === 'pending') {
    return { status: 'pending' as const }
  }

  // ready → Session in dieser Instanz (PWA) setzen und Claim verbrauchen
  if (!claim.user || !claim.loggedInAt) {
    await kv.removeItem(key)
    return { status: 'expired' as const }
  }

  await setUserSession(event, {
    user: claim.user,
    loggedInAt: claim.loggedInAt,
  })

  await kv.removeItem(key)

  return {
    status: 'ready' as const,
    redirect: claim.redirectTo ?? '/',
  }
})
