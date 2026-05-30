import { db } from 'hub:db'
import { getMemberAdminOverview } from '~~/server/members/admin-overview'
import { requireSuperuser } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireSuperuser(event)
  return getMemberAdminOverview(db, new Date())
})
