export default defineNuxtRouteMiddleware(async (to) => {
  const supabase = useSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  // Wenn der Benutzer nicht eingeloggt ist und versucht, auf eine geschützte Route zuzugreifen
  if (!session && to.path.startsWith('/admin')) {
    return navigateTo('/login')
  }

  // Wenn der Benutzer eingeloggt ist und versucht, auf die Login-Seite zuzugreifen
  if (session && to.path === '/login') {
    return navigateTo('/admin')
  }
})
