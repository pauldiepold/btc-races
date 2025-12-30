import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { randomBytes } from 'node:crypto'
import { z } from 'zod'
import { emailService } from '~~/server/email/service'
import type { EmailMessage } from '~~/server/email/email.types'

const loginSchema = z.object({
  email: z.email('Bitte gib eine gültige E-Mail-Adresse ein'),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const runtimeConfig = useRuntimeConfig()

  // Validierung mit Zod
  const result = loginSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.message,
    })
  }

  const { email } = result.data

  // 1. Prüfen, ob der User existiert
  const user = await db.query.users.findFirst({
    where: eq(schema.users.email, email.toLowerCase()),
  })

  if (!user) {
    // Sicherheitshalber geben wir keine Fehlermeldung aus, um User-Enumeration zu verhindern,
    // aber in diesem speziellen Fall (nur registrierte User) loggen wir es intern.
    console.log(`Login attempt for non-existent user: ${email}`)
    return { message: 'Wenn die E-Mail existiert, wurde ein Magic Link gesendet.' }
  }

  // 2. Token generieren
  const token = randomBytes(16).toString('hex')
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 Minuten

  // 3. Alte Tokens des Users löschen und neues Token speichern
  // await db.delete(schema.authTokens).where(eq(schema.authTokens.userId, user.id))

  await db.insert(schema.authTokens).values({
    token,
    userId: user.id,
    expiresAt,
  })

  // 4. Magic Link ausgeben (Console für Dev)
  const magicLink = `${runtimeConfig.public.siteUrl}/verify?token=${token}`

  const html = await renderEmailComponent(
    'LoginEmail',
    { firstName: user.firstName, magicLink, expiryMinutes: 15 },
    { pretty: true },
  )

  const text = await renderEmailComponent(
    'LoginEmail',
    { firstName: user.firstName, magicLink, expiryMinutes: 15 },
    { plainText: true },
  )

  const emailMessage: EmailMessage = {
    to: [{ address: user.email, displayName: `${user.firstName} ${user.lastName}` }],
    subject: 'Anmeldelink - BTC-Events',
    html,
    text,
  }

  await emailService.sendEmail(emailMessage)

  console.log('---------------------------------------')
  console.log(`Anmeldelink für ${email}:`)
  console.log(magicLink)
  console.log('---------------------------------------')

  return { message: 'Wenn die E-Mail existiert, wurde ein Magic Link gesendet.' }
})
