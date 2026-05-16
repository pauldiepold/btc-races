import { db } from 'hub:db'
import { z } from 'zod'
import {
  actorFromSession,
  changeRegistrationStatus,
  updateRegistrationNotes,
  withRegistrationErrorMapping,
} from '~~/server/registration'
import { parseBody } from '~~/server/utils/parse-body'
import { requireNumericIdParam } from '~~/server/utils/route-params'

const bodySchema = z.object({
  status: z.enum(['registered', 'canceled', 'maybe', 'yes', 'no']).optional(),
  notes: z.string().nullable().optional(),
  silent: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const id = requireNumericIdParam(event, 'Anmeldungs-ID')

  const { status, notes, silent } = await parseBody(event, bodySchema)

  const actor = actorFromSession(session)

  const deps = { db }

  return withRegistrationErrorMapping(async () => {
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
  })
})
