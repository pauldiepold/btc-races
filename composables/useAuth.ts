import type { Provider } from '@supabase/supabase-js'
import { ref } from 'vue'

const AUTH_PROVIDER: Record<'development' | 'production', Provider> = {
    development: 'google',
    production: 'azure',
} as const

export function useAuth() {
    const supabase = useSupabaseClient()
    const user = ref(null)
    const loading = ref(false)
    const error = ref('')

    async function login() {
        try {
            loading.value = true
            error.value = ''

            const { error: signInError } = await supabase.auth.signInWithOAuth({
                provider: 'azure',
            })

            if (signInError) throw signInError
        } catch (err) {
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
