import { db } from 'hub:db'
import { z } from 'zod'
import {
  registerMember,
  selfActor,
} from '~~/server/registration'
import { parseBody } from '~~/server/utils/parse-body'
import { withRegistrationErrorMapping } from '~~/server/utils/registration-error'
import { requireEventIdParam } from '~~/server/utils/route-params'

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
  const eventId = requireEventIdParam(event)

  const { notes, disciplines, status } = await parseBody(event, bodySchema)

  const actor = selfActor(session)

  return withRegistrationErrorMapping(async () => {
    const { id } = await registerMember(
      {
        eventId,
        userId: session.user.id,
        status,
        notes,
        wishDisciplines: disciplines,
      },
      actor,
      { db },
    )
    setResponseStatus(event, 201)
    return { id }
  })
})
