export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  return

  // Pfade, die NICHT geschützt werden sollen
  const publicPaths = [
    '/auth/',
    '/api/cron/',
    '/api/_nuxt_icon',
    '/api/_auth/',
  ]

  // Prüfen, ob der Pfad öffentlich ist
  const isPublicPath = publicPaths.some(publicPath => path.startsWith(publicPath))

  if (isPublicPath) {
    return
  }

  // Alle anderen Routen müssen authentifiziert sein
  await requireUserSession(event)
})
