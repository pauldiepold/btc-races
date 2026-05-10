import { db } from 'hub:db'
import { z } from 'zod'
import {
  RegistrationError,
  changeWishDisciplines,
  createProductionNotifier,
  errorToHttpStatus,
  type Actor,
} from '~~/server/registration'

const bodySchema = z.object({
  disciplines: z.array(z.object({
    discipline: z.string().min(1),
    ageClass: z.string().min(1),
  })).min(1),
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

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

  const actor: Actor = {
    kind: 'self',
    userId: session.user.id,
    hasLadvStartpass: !!session.user.hasLadvStartpass,
  }

  const notifier = createProductionNotifier(useRuntimeConfig().public.siteUrl)
  const deps = { db, notifier }

  try {
    return await changeWishDisciplines(
      { registrationId: id, disciplines: parsed.data.disciplines },
      actor,
      deps,
    )
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
