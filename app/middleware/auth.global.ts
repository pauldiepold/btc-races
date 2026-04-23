export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn, user } = useUserSession()

  // Öffentlich zugängliche Seiten
  if (to.path === '/' || to.path === '/login' || to.path === '/link-gesendet' || to.path === '/anmeldung-bestaetigt') {
    return
  }

  // Event-Detailseiten sind öffentlich (Gäste sehen eingeschränkte Ansicht)
  if (to.meta.public) {
    return
  }

  // Wenn nicht eingeloggt, zur Login-Seite weiterleiten (mit redirect zurück zur Zielseite)
  if (!loggedIn.value) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }

  const role = user.value?.role

  // /superuser nur für Superuser
  if (to.path.startsWith('/superuser') && role !== 'superuser') {
    return navigateTo('/')
  }

  // /admin nur für Admins und Superuser
  if (to.path.startsWith('/admin') && role !== 'admin' && role !== 'superuser') {
    return navigateTo('/')
  }
})
