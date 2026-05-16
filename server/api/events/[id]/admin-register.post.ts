import { db } from 'hub:db'
import { z } from 'zod'
import { requireAdmin } from '~~/server/utils/auth'
import {
  adminActor,
  registerMember,
  withRegistrationErrorMapping,
} from '~~/server/registration'
import { parseBody } from '~~/server/utils/parse-body'
import { requireEventIdParam } from '~~/server/utils/route-params'

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
  const eventId = requireEventIdParam(event)

  const { userId, status, notes, disciplines, setLadvStandImmediately } = await parseBody(event, bodySchema)

  const actor = adminActor(adminSession)

  return withRegistrationErrorMapping(async () => {
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
      { db },
    )
    setResponseStatus(event, 201)
    return { id }
  })
})
