<script setup lang="ts">
const supabase = useSupabaseClient()
const user = ref<any>(null)

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  user.value = session?.user
})

async function handleLogout() {
  await supabase.auth.signOut()
  navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-black text-white">
      <div class="container mx-auto px-4 py-4">
        <div class="flex justify-between items-center">
          <NuxtLink to="/admin" class="flex items-center space-x-2">
            <img src="~/assets/images/BTC_Logo_yellow.png" alt="BTC Logo" class="h-8 w-auto">
            <span class="text-xl font-bold">Admin Bereich</span>
          </NuxtLink>

          <div class="flex items-center space-x-4">
            <span v-if="user" class="text-sm">
              Eingeloggt als: {{ user.email }}
            </span>
            <button
              class="bg-[#ffb700] text-black px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors duration-300"
              @click="handleLogout"
            >
              Ausloggen
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="container mx-auto px-4 py-8">
      <slot />
    </main>
  </div>
</template>

<style>
/* Admin-Layout-spezifische Stile können hier hinzugefügt werden */
</style>
