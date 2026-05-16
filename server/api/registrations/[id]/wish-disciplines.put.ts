import { db } from 'hub:db'
import { z } from 'zod'
import {
  changeWishDisciplines,
  selfActor,
} from '~~/server/registration'
import { parseBody } from '~~/server/utils/parse-body'
import { withRegistrationErrorMapping } from '~~/server/utils/registration-error'
import { requireNumericIdParam } from '~~/server/utils/route-params'

const bodySchema = z.object({
  disciplines: z.array(z.object({
    discipline: z.string().min(1),
    ageClass: z.string().min(1),
  })).min(1),
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const id = requireNumericIdParam(event, 'Anmeldungs-ID')

  const { disciplines } = await parseBody(event, bodySchema)

  const actor = selfActor(session)

  const deps = { db }

  return withRegistrationErrorMapping(() =>
    changeWishDisciplines(
      { registrationId: id, disciplines },
      actor,
      deps,
    ),
  )
})
