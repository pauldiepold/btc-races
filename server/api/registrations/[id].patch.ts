import { db } from 'hub:db'
import { z } from 'zod'
import {
  changeRegistrationStatus,
  updateRegistrationNotes,
  type Actor,
} from '~~/server/registration'
import { parseBody } from '~~/server/utils/parse-body'
import { withRegistrationErrorMapping } from '~~/server/utils/registration-error'
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

  const isAdmin = session.user.role === 'admin' || session.user.role === 'superuser'
  const actor: Actor = isAdmin
    ? { kind: 'admin', userId: session.user.id }
    : { kind: 'self', userId: session.user.id, hasLadvStartpass: !!session.user.hasLadvStartpass }

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
