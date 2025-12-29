export default defineNuxtRouteMiddleware((to,) => {
  const { loggedIn, } = useUserSession()

  // Login-Seite ist öffentlich zugänglich
  if (to.path === '/login') {
    return
  }

  // Wenn nicht eingeloggt, zur Login-Seite weiterleiten
  if (!loggedIn.value) {
    return navigateTo('/login',)
  }
},)
