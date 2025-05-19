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
  <header class="bg-(--ui-bg-muted)">
    <div class="container mx-auto px-4 py-3">
      <div
        class="flex items-center"
        :class="{ 'justify-center': !user, 'justify-between': user }"
      >
        <NuxtLink to="/" class="group flex items-center">
          <img
            src="~/assets/images/BTC_Logo_yellow.png"
            alt="BTC Logo"
            class="h-12 w-auto transform transition-transform duration-300 group-hover:scale-110"
          />
        </NuxtLink>

        <template v-if="user">
          <!-- Desktop Navigation -->
          <nav class="hidden md:block">
            <ul class="flex space-x-6">
              <LayoutHeaderLink to="/" label="Wettkämpfe" />
              <LayoutHeaderLink v-if="user" to="/admin" label="Admin" />
            </ul>
          </nav>

          <!-- User Info und Logout (Desktop) -->
          <div class="hidden items-center space-x-6 md:flex">
            <template v-if="user">
              <span class="text-sm">
                {{ user.user_metadata.full_name }}
              </span>
              <UButton
                variant="soft"
                class="cursor-pointer"
                icon="i-lucide-log-out"
                @click="handleLogout"
              >
                Ausloggen
              </UButton>
            </template>
          </div>

          <!-- Mobile Menu Button -->
          <button
            class="hover:text-primary text-white transition-colors md:hidden"
            aria-label="Menü öffnen"
            @click="toggleMenu"
          >
            <Icon
              :name="isMenuOpen ? 'i-lucide-x' : 'i-lucide-menu'"
              size="26px"
            />
          </button>
        </template>
      </div>

      <!-- Mobile Navigation -->
      <template v-if="user">
        <div
          v-show="isMenuOpen"
          class="absolute right-0 left-0 z-50 bg-(--ui-bg-muted) md:hidden"
        >
          <ul class="space-y-4 px-4 py-4">
            <LayoutHeaderLinkMobile
              to="/"
              label="Wettkämpfe"
              :is-menu-open="isMenuOpen"
              @close-menu="isMenuOpen = false"
            />
            <LayoutHeaderLinkMobile
              v-if="user"
              to="/admin"
              label="Admin-Dashboard"
              :is-menu-open="isMenuOpen"
              @close-menu="isMenuOpen = false"
            />
            <li v-if="user" class="border-t border-gray-700 pt-4 text-center">
              <div class="flex flex-col space-y-4">
                <span class="text-sm text-gray-400">
                  Eingeloggt als: {{ user.email }}
                </span>
                <UButton
                  variant="outline"
                  class="w-full justify-center"
                  icon="i-lucide-log-out"
                  @click="handleLogout"
                >
                  Ausloggen
                </UButton>
              </div>
            </li>
          </ul>
        </div>
      </template>
    </div>
  </header>
</template>
