<script setup lang="ts">
const { user } = useAuth()
</script>

<template>
  <footer class="bg-(--ui-bg-muted) py-8">
    <div class="container mx-auto px-4">
      <div class="flex flex-col items-center justify-center space-y-6">
        <UButton
          v-if="!user"
          icon="i-lucide-settings"
          to="/admin"
          variant="soft"
          color="primary"
        >
          Admin-Bereich
        </UButton>

        <div class="text-center">
          <p class="mb-2">
            <ULink
              href="https://berlin-track-club.de"
              target="_blank"
              rel="noopener noreferrer"
              class="hover:text-primary transition-colors"
            >
              © {{ new Date().getFullYear() }} - Berlin Track Club e.V.
            </ULink>
          </p>

          <p class="text-sm text-gray-400">
            Entwickelt mit
            <ULink
              href="https://nuxt.com"
              target="_blank"
              class="hover:text-primary transition-colors"
              >Nuxt.js</ULink
            >
            &
            <ULink
              href="https://supabase.com"
              target="_blank"
              class="hover:text-primary transition-colors"
              >Supabase</ULink
            >
          </p>
        </div>

        <UButton
          href="https://github.com/pauldiepold/btc-races"
          target="_blank"
          icon="i-lucide-github"
          variant="ghost"
          class="hover:text-primary transition-colors"
        >
          zum GitHub-Repo
        </UButton>
      </div>
    </div>
  </footer>
</template>
