<script setup lang="ts">
const supabase = useSupabaseClient()
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  try {
    loading.value = true
    error.value = ''

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
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
</script>

<template>
  <div class="container-box max-w-md mx-auto">
    <h2 class="text-2xl font-bold mb-6 text-center">
      Admin Login
    </h2>

    <div class="space-y-4">
      <div v-if="error" class="text-red-500 text-sm">
        {{ error }}
      </div>

      <button
        :disabled="loading"
        class="w-full bg-[#ffb700] text-black py-2 px-4 rounded-md hover:bg-yellow-600 transition-colors duration-300 disabled:opacity-50"
        @click="handleLogin"
      >
        {{ loading ? 'Wird eingeloggt...' : 'Mit Microsoft anmelden' }}
      </button>
    </div>
  </div>
</template>
