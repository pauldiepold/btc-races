import { db } from 'hub:db'
import { z } from 'zod'
import { requireAdmin } from '~~/server/utils/auth'
import {
  adminActor,
  setLadvStand,
  withRegistrationErrorMapping,
} from '~~/server/registration'
import { parseBody } from '~~/server/utils/parse-body'
import { requireNumericIdParam } from '~~/server/utils/route-params'

const bodySchema = z.object({
  disciplines: z.array(z.object({
    discipline: z.string().min(1),
    ageClass: z.string().min(1),
  })).nullable(),
})

export default defineEventHandler(async (event) => {
  const adminSession = await requireAdmin(event)
  const id = requireNumericIdParam(event, 'Anmeldungs-ID')

  const { disciplines } = await parseBody(event, bodySchema)

  const actor = adminActor(adminSession)
  const deps = { db }

  return withRegistrationErrorMapping(() =>
    setLadvStand(
      { registrationId: id, disciplines },
      actor,
      deps,
    ),
  )
})
