<script setup lang="ts">
const supabase = useSupabaseClient()

onMounted(async () => {
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error) {
    console.error('Error getting session:', error)
    navigateTo('/login')
    return
  }

  if (session) {
    navigateTo('/admin')
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffb700] mx-auto" />
      <p class="mt-4 text-gray-600">
        Wird eingeloggt...
      </p>
    </div>
  </div>
</template>
