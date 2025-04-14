<script setup lang="ts">
const { user } = useAuth()
</script>

<template>
  <footer class="bg-(--ui-bg-muted) py-8">
    <div class="container mx-auto px-4">
      <div class="flex flex-col items-center justify-center space-y-4">
        <p class="text-center">
          © {{ new Date().getFullYear() }} - Berlin Track Club e.V.
        </p>
        <ULink
          href="https://berlin-track-club.de"
          target="_blank"
          rel="noopener noreferrer"
        >
          https://berlin-track-club.de
        </ULink>
        <UButton v-if="!user" to="/admin" variant="solid" color="neutral">
          Admin-Bereich
        </UButton>
      </div>
    </div>
  </footer>
</template>
