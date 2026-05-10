import { db } from 'hub:db'
import { z } from 'zod'
import {
  RegistrationError,
  changeRegistrationStatus,
  createProductionNotifier,
  errorToHttpStatus,
  updateRegistrationNotes,
  type Actor,
  type AppDb,
} from '~~/server/registration'

const bodySchema = z.object({
  status: z.enum(['registered', 'canceled', 'maybe', 'yes', 'no']).optional(),
  notes: z.string().nullable().optional(),
  silent: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const isAdmin = session.user.role === 'admin' || session.user.role === 'superuser'

  const rawId = getRouterParam(event, 'id')
  if (!rawId) {
    throw createError({ statusCode: 400, statusMessage: 'Fehlende Anmeldungs-ID' })
  }
  const id = Number(rawId)
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Ungültige Anmeldungs-ID' })
  }

  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'Validierungsfehler' })
  }
  const { status, notes, silent } = parsed.data

  const actor: Actor = isAdmin
    ? { kind: 'admin', userId: session.user.id }
    : { kind: 'self', userId: session.user.id, hasLadvStartpass: !!session.user.hasLadvStartpass }

  const notifier = createProductionNotifier(useRuntimeConfig().public.siteUrl)
  const deps = { db: db as unknown as AppDb, notifier }

  try {
    let statusChanged = false

    if (status !== undefined) {
      await changeRegistrationStatus(
        { registrationId: id, newStatus: status },
        actor,
        deps,
        { silent: silent ?? false },
      )
      statusChanged = true
    }

    if (notes !== undefined) {
      const notesSilent = silent === true || statusChanged
      await updateRegistrationNotes(
        { registrationId: id, notes },
        actor,
        deps,
        { silent: notesSilent },
      )
    }

    return { id }
  }
  catch (err) {
    if (err instanceof RegistrationError) {
      throw createError({
        statusCode: errorToHttpStatus(err.code),
        statusMessage: err.message,
      })
    }
    throw err
  }
})
