import type { Provider } from '@supabase/supabase-js'
import { ref } from 'vue'

export function useAuth() {
  const supabase = useSupabaseClient()
  const user = ref<any>(null)
  const loading = ref(false)
  const error = ref('')

  async function login() {
    try {
      loading.value = true
      error.value = ''

      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: process.dev ? 'google' : 'azure' as Provider,
        options: {
          redirectTo: window.location.origin,
          scopes: 'email profile',
        },
      })

      if (signInError)
        throw signInError
    }
    catch (err: any) {
      error.value = err.message || 'Ein Fehler ist aufgetreten'
    }
    finally {
      loading.value = false
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    user.value = null
  }

  async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession()
    user.value = session?.user
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
