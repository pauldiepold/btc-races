<script setup lang="ts">
import { de } from '@nuxt/ui/locale'

const { user } = useUserSession()

useSeoMeta({
  description: 'Events des Berlin Track Clubs.',
  ogTitle: 'BTC Events',
  ogDescription: 'Events des Berlin Track Clubs.',
  twitterTitle: 'BTC Events',
  twitterDescription: 'Events des Berlin Track Clubs.',
  twitterCard: 'summary_large_image',
})

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'theme-color', content: '#ffb700' },
    { name: 'mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
    { name: 'apple-mobile-web-app-title', content: 'BTC Races' },
  ],
  htmlAttrs: {
    lang: 'de',
  },
})
</script>

<template>
  <UApp
    :locale="de"
    :toaster="{
      position: 'top-center',
      duration: 3000,
    }"
  >
    <UHeader
      title="BTC Events"
    >
      <template #title>
        <div class="group flex items-center gap-6">
          <UIcon
            name="i-btc-logo"
            alt="BTC Logo"
            class="size-14 text-yellow-500 transform transition-transform duration-300 group-hover:scale-110"
          />
          <span class="font-display font-semibold">BTC Events</span>
        </div>
      </template>

      <template #right>
        <div class="hidden lg:flex items-center">
          <UserMenu />
        </div>
      </template>

      <template #body>
        <UserMenu :expanded="true" />
      </template>
    </UHeader>

    <NuxtLoadingIndicator
      color="#ffb700"
      :height="2"
    />

    <PushBanner />

    <UMain>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </UMain>

    <UFooter class="mb-4 border-t border-yellow-500/30">
      <template #left>
        <UButton
          v-if="user?.role === 'admin'"
          to="/admin"
          icon="i-ph-shield-check-bold"
          label="Admin"
          color="primary"
          variant="soft"
          size="sm"
        />
      </template>

      <template #default>
        <div class="flex flex-col items-center gap-2">
          <UIcon
            name="i-btc-logo"
            class="size-12 text-yellow-500"
          />
          <ULink
            href="https://berlin-track-club.de"
            target="_blank"
            rel="noopener noreferrer"
            class="text-sm text-muted hover:text-primary transition-colors"
          >
            © {{ new Date().getFullYear() }} Berlin Track Club
          </ULink>
        </div>
      </template>

      <template #right>
        <div class="flex items-center gap-1">
          <UButton
            to="https://www.instagram.com/berlintrackclub/"
            target="_blank"
            icon="i-simple-icons-instagram"
            aria-label="Instagram"
            color="neutral"
            variant="ghost"
          />
          <UButton
            to="https://github.com/pauldiepold/btc-races"
            target="_blank"
            icon="i-simple-icons-github"
            aria-label="GitHub"
            color="neutral"
            variant="ghost"
          />
        </div>
      </template>
    </UFooter>
  </UApp>
</template>
