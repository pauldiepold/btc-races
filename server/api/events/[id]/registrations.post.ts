import { db } from 'hub:db'
import { z } from 'zod'
import {
  RegistrationError,
  createProductionNotifier,
  errorToHttpStatus,
  registerMember,
  type Actor,
} from '~~/server/registration'

const bodySchema = z.object({
  notes: z.string().optional(),
  disciplines: z.array(z.object({
    discipline: z.string(),
    ageClass: z.string(),
  })).optional(),
  status: z.enum(['registered', 'maybe', 'yes', 'no']).optional(),
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const sqid = getRouterParam(event, 'id')

  if (!sqid) {
    throw createError({ statusCode: 400, statusMessage: 'Fehlende Event-ID' })
  }

  const eventId = decodeEventId(sqid)
  if (eventId === null) {
    throw createError({ statusCode: 404, statusMessage: 'Event nicht gefunden' })
  }

  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'Validierungsfehler' })
  }
  const { notes, disciplines, status } = parsed.data

  const actor: Actor = {
    kind: 'self',
    userId: session.user.id,
    hasLadvStartpass: !!session.user.hasLadvStartpass,
  }
  const notifier = createProductionNotifier(useRuntimeConfig().public.siteUrl)

  try {
    const { id } = await registerMember(
      {
        eventId,
        userId: session.user.id,
        status,
        notes,
        wishDisciplines: disciplines,
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
