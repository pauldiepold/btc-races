export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()

  // Login-Seite ist öffentlich zugänglich
  if (to.path === '/auth/login' || to.path === '/auth/link-gesendet') {
    return
  }

  // Wenn nicht eingeloggt, zur Login-Seite weiterleiten
  if (!loggedIn.value) {
    return navigateTo('/auth/login')
  }
})
