export default defineEventHandler(async (event,) => {
  const path = getRequestURL(event,).pathname

  // Pfade, die NICHT geschützt werden sollen
  const publicPaths = [
    '/api/auth/',
    '/api/cron/',
    '/api/_nuxt_icon',
    '/api/_auth/',
  ]

  // Prüfen, ob der Pfad öffentlich ist
  const isPublicPath = publicPaths.some(publicPath => path.startsWith(publicPath,),)

  if (isPublicPath) {
    return
  }

  // Alle anderen API-Routen müssen authentifiziert sein
  if (path.startsWith('/api/',)) {
    await requireUserSession(event,)
  }
},)
