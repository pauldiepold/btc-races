<script setup lang="ts">
// Props für die Überschrift
defineProps({
  pageTitle: {
    type: String,
    default: '',
  },
})

const supabase = useSupabaseClient()
const user = ref<any>(null)
const isMenuOpen = ref(false)

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  user.value = session?.user
})

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

async function handleLogout() {
  await supabase.auth.signOut()
  navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <header class="bg-black text-white">
      <div class="container mx-auto px-4 py-3">
        <div class="flex justify-between items-center">
          <NuxtLink to="/" class="flex items-center group">
            <img
              src="~/assets/images/BTC_Logo_yellow.png"
              alt="BTC Logo"
              class="h-12 w-auto transform transition-transform duration-300 group-hover:scale-110"
            >
          </NuxtLink>

          <!-- Desktop Navigation -->
          <nav class="hidden md:block">
            <ul class="flex space-x-6">
              <NavHeaderLink to="/" label="Startseite" />
              <NavHeaderLink to="/competitions" label="Wettkämpfe" />
              <NavHeaderLink v-if="user" to="/admin" label="Admin" />
            </ul>
          </nav>

          <!-- User Info und Logout (Desktop) -->
          <div v-if="user" class="hidden md:flex items-center space-x-4">
            <span class="text-sm">
              {{ user.email }}
            </span>
            <button
              class="bg-[#ffb700] text-black px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors duration-300"
              @click="handleLogout"
            >
              Ausloggen
            </button>
          </div>

          <!-- Mobile Menu Button -->
          <button
            class="md:hidden text-white hover:text-[#ffb700] transition-colors"
            aria-label="Menü öffnen"
            @click="toggleMenu"
          >
            <Icon
              :name="isMenuOpen ? 'heroicons:x-mark' : 'heroicons:bars-3'"
              class="w-8 h-8"
            />
          </button>
        </div>

        <!-- Mobile Navigation -->
        <div
          v-show="isMenuOpen"
          class="md:hidden absolute left-0 right-0 bg-black z-50"
        >
          <ul class="py-4 px-4 space-y-4">
            <NavHeaderLinkMobile
              to="/"
              label="Startseite"
              :is-menu-open="isMenuOpen"
              @close-menu="isMenuOpen = false"
            />
            <NavHeaderLinkMobile
              to="/competitions"
              label="Wettkämpfe"
              :is-menu-open="isMenuOpen"
              @close-menu="isMenuOpen = false"
            />
            <NavHeaderLinkMobile
              v-if="user"
              to="/admin"
              label="Admin"
              :is-menu-open="isMenuOpen"
              @close-menu="isMenuOpen = false"
            />
            <li v-if="user" class="pt-4 border-t border-gray-700">
              <div class="flex flex-col space-y-4">
                <span class="text-sm text-gray-400">
                  Eingeloggt als: {{ user.email }}
                </span>
                <button
                  class="bg-[#ffb700] text-black px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors duration-300"
                  @click="handleLogout"
                >
                  Ausloggen
                </button>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </header>

    <!-- Page Header mit Titel -->
    <div v-if="pageTitle" class="py-8 bg-gray-100">
      <div class="container mx-auto px-4">
        <h1 class="text-3xl font-bold mb-2">
          {{ pageTitle }}
        </h1>
      </div>
    </div>

    <main class="flex-grow container mx-auto px-4 py-6">
      <slot />
    </main>

    <footer class="bg-black text-white py-8">
      <div class="container mx-auto px-4">
        <div class="flex flex-col justify-center items-center space-y-4">
          <div class="text-center">
            <p>© {{ new Date().getFullYear() }} Berlin Track Club e.V.</p>
          </div>
          <a
            href="https://berlin-track-club.de"
            target="_blank"
            rel="noopener noreferrer"
            class="hover:text-[#ffb700] transition-colors"
          >
            https://berlin-track-club.de
          </a>
          <NuxtLink
            v-if="!user"
            to="/login"
            class="px-4 py-2 bg-[#ffb700] text-black font-medium rounded-lg hover:bg-[#ffc940] transition-colors"
          >
            Admin-Bereich
          </NuxtLink>
        </div>
      </div>
    </footer>
  </div>
</template>

<style>
/* Layout-spezifische Stile können hier hinzugefügt werden */
</style>
