import { requireSuperuser } from '~~/server/utils/auth'
import { pushService } from '~~/server/notifications/push'

export default defineEventHandler(async (event) => {
  await requireSuperuser(event)

  const stats = await pushService.sendPushToAll({
    title: 'Berlin Track Club — Test',
    body: 'Push-Test erfolgreich. Wenn du das siehst, läuft alles.',
    url: '/',
  })

  return { ok: true, stats }
})
