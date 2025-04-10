<script setup>
import MobileNavLink from '~/components/navigation/MobileNavLink.vue'
import NavLink from '~/components/navigation/NavLink.vue'

const isMenuOpen = ref(false)

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
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
            <span class="ml-8 text-xl font-bold tracking-wider relative">
              Wettkampfanmeldung
              <span class="absolute -bottom-1 left-0 w-full h-0.5 bg-[#ffb700] transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
            </span>
          </NuxtLink>

          <!-- Desktop Navigation -->
          <nav class="hidden md:block">
            <ul class="flex space-x-6">
              <NavLink to="/" label="Startseite" />
              <NavLink to="/competitions" label="Wettkämpfe" />
            </ul>
          </nav>

          <!-- Mobile Menu Button -->
          <button
            class="md:hidden text-white hover:text-[#ffb700] transition-colors"
            aria-label="Menü öffnen"
            @click="toggleMenu"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                v-if="!isMenuOpen"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
              <path
                v-else
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Mobile Navigation -->
        <div
          v-show="isMenuOpen"
          class="md:hidden absolute left-0 right-0 bg-black z-50"
        >
          <ul class="py-4 px-4 space-y-4">
            <MobileNavLink
              to="/"
              label="Startseite"
              :is-menu-open="isMenuOpen"
              @close-menu="isMenuOpen = false"
            />
            <MobileNavLink
              to="/competitions"
              label="Wettkämpfe"
              :is-menu-open="isMenuOpen"
              @close-menu="isMenuOpen = false"
            />
          </ul>
        </div>
      </div>
    </header>

    <main class="flex-1 container mx-auto px-4 py-6">
      <slot />
    </main>

    <footer class="bg-black text-white py-6 mt-auto">
      <div class="container mx-auto px-4">
        <div class="flex justify-center items-center">
          <div class="text-center">
            <p>© {{ new Date().getFullYear() }} BTC Wettkampfanmeldung</p>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<style>
/* Layout-spezifische Stile können hier hinzugefügt werden */
</style>
