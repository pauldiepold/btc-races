import { db } from 'hub:db'
import { z } from 'zod'
import { requireAdmin } from '~~/server/utils/auth'
import {
  RegistrationError,
  createProductionNotifier,
  errorToHttpStatus,
  setLadvStand,
  type Actor,
  type AppDb,
} from '~~/server/registration'

const bodySchema = z.object({
  disciplines: z.array(z.object({
    discipline: z.string().min(1),
    ageClass: z.string().min(1),
  })).nullable(),
})

export default defineEventHandler(async (event) => {
  const adminSession = await requireAdmin(event)

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

  const actor: Actor = { kind: 'admin', userId: adminSession.user.id }

  const notifier = createProductionNotifier(useRuntimeConfig().public.siteUrl)
  const deps = { db: db as unknown as AppDb, notifier }

  try {
    return await setLadvStand(
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
