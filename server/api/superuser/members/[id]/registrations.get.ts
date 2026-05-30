import { db } from 'hub:db'
import { getMemberRegistrations } from '~~/server/members/admin-overview'
import { requireSuperuser } from '~~/server/utils/auth'
import { requireNumericIdParam } from '~~/server/utils/route-params'

export default defineEventHandler(async (event) => {
  await requireSuperuser(event)
  const userId = requireNumericIdParam(event, 'Member')
  return getMemberRegistrations(db, userId)
})
