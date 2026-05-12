import { db } from 'hub:db'
import { z } from 'zod'
import { requireAdmin } from '~~/server/utils/auth'
import {
  setLadvStand,
  type Actor,
} from '~~/server/registration'
import { parseBody } from '~~/server/utils/parse-body'
import { withRegistrationErrorMapping } from '~~/server/utils/registration-error'
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

  const actor: Actor = { kind: 'admin', userId: adminSession.user.id }
  const deps = { db }

  return withRegistrationErrorMapping(() =>
    setLadvStand(
      { registrationId: id, disciplines },
      actor,
      deps,
    ),
  )
})
