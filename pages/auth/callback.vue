<script setup lang="ts">
const supabase = useSupabaseClient()
const route = useRoute()

onMounted(async () => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    console.error('Error getting session:', error)
    navigateTo('/login')
    return
  }

  if (session) {
    // Prüfe, ob ein Redirect-Parameter vorhanden ist
    const redirectTo = route.query.redirect as string
    if (redirectTo) {
      navigateTo(redirectTo)
    } else {
      navigateTo('/admin')
    }
  }
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <div class="text-center">
      <div
        class="border-primary mx-auto h-12 w-12 animate-spin rounded-full border-b-2"
      />
      <p class="mt-4 text-gray-600">Wird eingeloggt...</p>
    </div>
  </div>
</template>
