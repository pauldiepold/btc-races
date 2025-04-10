<script setup lang="ts">
const { user, logout, checkSession } = useAuth()
const isMenuOpen = ref(false)

onMounted(async () => {
  await checkSession()
})

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

async function handleLogout() {
  await logout()
  navigateTo('/')
}
</script>

<template>
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
            <LayoutHeaderLink to="/" label="Startseite" />
            <LayoutHeaderLink to="/competitions" label="Wettkämpfe" />
            <LayoutHeaderLink v-if="user" to="/admin" label="Admin" />
          </ul>
        </nav>

        <!-- User Info und Logout (Desktop) -->
        <div class=" items-center space-x-6 hidden md:flex">
          <template v-if="user">
            <span class="text-sm">
              {{ user.user_metadata.full_name }}
            </span>
            <BaseButton
              @click="handleLogout"
            >
              Ausloggen
            </BaseButton>
          </template>
        </div>

        <!-- Mobile Menu Button -->
        <button
          class="md:hidden text-white hover:text-primary transition-colors"
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
          <LayoutHeaderLinkMobile
            to="/"
            label="Startseite"
            :is-menu-open="isMenuOpen"
            @close-menu="isMenuOpen = false"
          />
          <LayoutHeaderLinkMobile
            to="/competitions"
            label="Wettkämpfe"
            :is-menu-open="isMenuOpen"
            @close-menu="isMenuOpen = false"
          />
          <LayoutHeaderLinkMobile
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
              <BaseButton
                @click="handleLogout"
              >
                Ausloggen
              </BaseButton>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </header>
</template>
