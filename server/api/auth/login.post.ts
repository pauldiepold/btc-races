import { db, schema } from 'hub:db'
import { kv } from 'hub:kv'
import { eq } from 'drizzle-orm'
import { randomBytes } from 'node:crypto'
import { z } from 'zod'
import { emailService } from '~~/server/email/service'
import type { EmailMessage } from '~~/server/email/email.types'

const RATE_LIMIT_MAX = 10
const RATE_LIMIT_TTL = 300 // 5 Minuten

const loginSchema = z.object({
  email: z.email('Bitte gib eine gültige E-Mail-Adresse ein'),
  turnstileToken: z.string().min(1, 'Sicherheitsprüfung fehlt'),
  redirect: z.string().optional(),
  claimId: z.uuid().optional(),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const runtimeConfig = useRuntimeConfig()

  const result = loginSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: result.error.issues[0]?.message ?? 'Ungültige Eingabe',
    })
  }

  const { email, turnstileToken, redirect: rawRedirect, claimId } = result.data

  // 1. Turnstile-Token serverseitig verifizieren
  await verifyTurnstileToken(turnstileToken, event)

  // 2. Rate-Limiting: max. 10 Versuche pro IP in 5 Minuten (Fixed Window)
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  const rateLimitKey = `login:ratelimit:${ip}`
  const now = Date.now()
  const record = await kv.getItem<{ count: number, resetAt: number }>(rateLimitKey)
  const isExpired = !record || now >= record.resetAt

  if (!isExpired && record!.count >= RATE_LIMIT_MAX) {
    throw createError({
      statusCode: 429,
      message: 'Zu viele Anmeldeversuche. Bitte versuche es in 5 Minuten erneut.',
    })
  }

  if (isExpired) {
    await kv.setItem(rateLimitKey, { count: 1, resetAt: now + RATE_LIMIT_TTL * 1000 }, { ttl: RATE_LIMIT_TTL })
  }
  else {
    await kv.setItem(rateLimitKey, { count: record!.count + 1, resetAt: record!.resetAt }, { ttl: Math.ceil((record!.resetAt - now) / 1000) })
  }

  const redirectParam = rawRedirect?.startsWith('/') && !rawRedirect.startsWith('//')
    ? rawRedirect
    : undefined

  // 3. User-Lookup — jetzt mit echtem Fehlerfeedback
  const user = await db.query.users.findFirst({
    where: eq(schema.users.email, email.toLowerCase()),
  })

  if (!user || user.membershipStatus !== 'active') {
    console.log(`Login attempt for non-existent or inactive user: ${email}`)
    throw createError({
      statusCode: 404,
      message: 'Diese E-Mail-Adresse ist uns nicht bekannt. Bitte prüfe deine Eingabe.',
    })
  }

  // 4. Token generieren und speichern
  const token = randomBytes(16).toString('base64url')
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

  await db.insert(schema.authTokens).values({
    token,
    userId: user.id,
    expiresAt,
  })

  // Optional: Claim für iOS-PWA-Polling anlegen (gleiche Lebensdauer wie Token)
  if (claimId) {
    await kv.setItem(`authclaim:${claimId}`, { status: 'pending' }, { ttl: 15 * 60 })
  }

  // 5. Magic Link senden
  const magicLinkBase = `${runtimeConfig.public.siteUrl}/magic-link/${token}`
  const params = new URLSearchParams()
  if (redirectParam) params.set('redirect', redirectParam)
  if (claimId) params.set('claim', claimId)
  const magicLink = params.size > 0
    ? `${magicLinkBase}?${params.toString()}`
    : magicLinkBase

  const htmlResult = await renderEmailComponent(
    'LoginEmail',
    { firstName: user.firstName, magicLink, expiryMinutes: 15 },
    { pretty: true },
  )

  const textResult = await renderEmailComponent(
    'LoginEmail',
    { firstName: user.firstName, magicLink, expiryMinutes: 15 },
    { plainText: true },
  )

  const html = typeof htmlResult === 'string' ? htmlResult : htmlResult.html
  const text = typeof textResult === 'string' ? textResult : textResult.html

  const emailMessage: EmailMessage = {
    to: [{ address: user.email, displayName: `${user.firstName} ${user.lastName}` }],
    subject: 'Anmeldelink - Berlin Track Club',
    html,
    text,
    bypassTestMode: true,
  }

  await emailService.sendEmail(emailMessage)

  if (import.meta.dev) {
    console.log('---------------------------------------')
    console.log(`Anmeldelink für ${email}:`)
    console.log(magicLink)
    console.log('---------------------------------------')
  }

  return { message: 'Magic Link wurde gesendet.' }
})
