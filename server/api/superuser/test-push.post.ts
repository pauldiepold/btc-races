import { requireSuperuser } from '~~/server/utils/auth'
import { pushService } from '~~/server/notifications/push'

export default defineEventHandler(async (event) => {
  const session = await requireSuperuser(event)

  await pushService.sendPushToUser(session.user.id, {
    title: 'BTC Races — Test',
    body: 'Push-Test erfolgreich. Wenn du das siehst, läuft alles.',
    url: '/',
  })

  return { ok: true }
})
