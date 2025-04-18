import { ref } from 'vue'
import type { Provider } from '@supabase/supabase-js'

export function useAuth() {
  const supabase = useSupabaseClient()
  const config = useRuntimeConfig()
  const user = ref()
  const loading = ref(false)
  const error = ref('')
  const provider: Provider = (config.public.authProvider as Provider) || 'azure'

  async function login() {
    try {
      loading.value = true
      error.value = ''

      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
          scopes: 'email profile',
        },
      })

      if (signInError) throw signInError
    } catch (err: any) {
      error.value = err.message || 'Ein Fehler ist aufgetreten'
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    user.value = null
  }

  async function checkSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    user.value = session?.user || null
  }

  return {
    user,
    loading,
    error,
    login,
    logout,
    checkSession,
  }
}
