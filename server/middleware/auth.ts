export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  // Cron-Routen verwenden Bearer-Token-Auth im Route-Handler selbst
  // Auth-Routen sind per Definition öffentlich (Login-Flow)
  const publicPaths = ['/api/auth/', '/api/cron/']

  const isPublicPath = publicPaths.some(publicPath => path.startsWith(publicPath))

  if (isPublicPath) {
    return
  }

  // Alle anderen /api/-Routen erfordern eine Session
  if (path.startsWith('/api/')) {
    await requireUserSession(event)
  }
})
