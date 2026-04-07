export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn, user } = useUserSession()

  // Login-Seite ist öffentlich zugänglich
  if (to.path === '/login' || to.path === '/link-gesendet') {
    return
  }

  // Wenn nicht eingeloggt, zur Login-Seite weiterleiten
  if (!loggedIn.value) {
    return navigateTo('/login')
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
