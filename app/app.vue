<script setup lang="ts">
import { de } from '@nuxt/ui/locale'

useSeoMeta({
  description:
      'Die LADV-Wettkampf-Anmeldung für Mitglieder des Berlin Track Clubs.',
  ogTitle: 'BTC Wettkampfanmeldung',
  ogDescription:
      'Die LADV-Wettkampf-Anmeldung für Mitglieder des Berlin Track Clubs.',
  ogImage: '/logo-yellow-padding.png',
  twitterTitle: 'BTC Wettkampfanmeldung',
  twitterDescription:
      'Die LADV-Wettkampf-Anmeldung für Mitglieder des Berlin Track Clubs.',
  twitterImage: '/logo-yellow-padding.png',
  twitterCard: 'summary',
})

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' },
  ],
  htmlAttrs: {
    lang: 'de',
  },
})

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await clear()
}
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
        <NuxtLink
          to="/"
          class="group flex items-center gap-6"
        >
          <img
            src="/logo-yellow.png"
            alt="BTC Logo"
            class="h-12 p-1 w-auto transform transition-transform duration-300 group-hover:scale-110"
          >
          <p class="font-normal">BTC Events</p>
        </NuxtLink>
      </template>
    </UHeader>

    <NuxtLoadingIndicator
      color="#ffb700"
      :height="2"
    />

    <UMain>
      <NuxtPage />
    </UMain>

    <USeparator
      icon="i-simple-icons-nuxtdotjs"
      type="dashed"
      class="h-px"
    />

    <UFooter>
      <template #left>
        <UColorModeButton />
      </template>

      <template #right>
        <UButton
          to="https://github.com/pauldiepold/btc-races"
          target="_blank"
          icon="i-simple-icons-github"
          aria-label="GitHub"
          color="neutral"
          variant="ghost"
        />
      </template>

      <template #default>
        <div class="flex flex-col items-center justify-center gap-4">
          <ULink
            href="https://berlin-track-club.de"
            target="_blank"
            rel="noopener noreferrer"
            class="hover:text-primary transition-colors"
          >
            © {{ new Date().getFullYear() }} - Berlin Track Club
          </ULink>
        </div>
      </template>
    </UFooter>
  </UApp>
</template>
