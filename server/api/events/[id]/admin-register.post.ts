import { db } from 'hub:db'
import { z } from 'zod'
import { requireAdmin } from '~~/server/utils/auth'
import { decodeEventId } from '~~/server/utils/sqids'
import {
  RegistrationError,
  createProductionNotifier,
  errorToHttpStatus,
  registerMember,
  type Actor,
} from '~~/server/registration'

const bodySchema = z.object({
  userId: z.number().int().positive(),
  status: z.enum(['registered', 'maybe', 'yes', 'no']).optional(),
  notes: z.string().optional(),
  disciplines: z.array(z.object({
    discipline: z.string(),
    ageClass: z.string(),
  })).optional(),
  setLadvStandImmediately: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  const adminSession = await requireAdmin(event)

  const sqid = getRouterParam(event, 'id')
  if (!sqid) throw createError({ statusCode: 400, statusMessage: 'Fehlende Event-ID' })

  const eventId = decodeEventId(sqid)
  if (eventId === null) throw createError({ statusCode: 404, statusMessage: 'Event nicht gefunden' })

  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'Validierungsfehler' })
  }
  const { userId, status, notes, disciplines, setLadvStandImmediately } = parsed.data

  const actor: Actor = { kind: 'admin', userId: adminSession.user.id }
  const notifier = createProductionNotifier(useRuntimeConfig().public.siteUrl)

  try {
    const { id } = await registerMember(
      {
        eventId,
        userId,
        status,
        notes,
        wishDisciplines: disciplines,
        setLadvStandImmediately,
      },
      actor,
      { db, notifier },
    )
    setResponseStatus(event, 201)
    return { id }
  }
  catch (e) {
    if (e instanceof RegistrationError) {
      throw createError({ statusCode: errorToHttpStatus(e.code), statusMessage: e.message })
    }
    throw e
  }
})
