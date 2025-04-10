<script setup lang="ts">
const { user } = useAuth()
</script>

<template>
  <footer class="bg-black text-white py-8">
    <div class="container mx-auto px-4">
      <div class="flex flex-col justify-center items-center space-y-4">
        <div class="text-center">
          <p>© {{ new Date().getFullYear() }} - Berlin Track Club e.V.</p>
        </div>
        <a
          href="https://berlin-track-club.de"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-primary transition-colors"
        >
          https://berlin-track-club.de
        </a>
        <NuxtLink
          v-if="!user"
          to="/admin"
          class="px-4 py-2 bg-primary text-black font-medium rounded-lg hover:bg-[#ffc940] transition-colors"
        >
          Admin-Bereich
        </NuxtLink>
      </div>
    </div>
  </footer>
</template>
