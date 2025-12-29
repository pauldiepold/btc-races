export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  // Pfade, die NICHT geschützt werden sollen
  const protectedPaths = [
    '/events/',
  ]

  // Prüfen, ob der Pfad öffentlich ist
  const isProtectedPath = protectedPaths.some(protectedPath => path.startsWith(protectedPath))

  if (!isProtectedPath) {
    return
  }

  // Alle anderen Routen müssen authentifiziert sein
  await requireUserSession(event)
})
