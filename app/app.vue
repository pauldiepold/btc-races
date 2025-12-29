<script setup lang="ts">
import { de } from '@nuxt/ui/locale'

useSeoMeta({
  description:
      'Die LADV-Wettkampf-Anmeldung für Mitglieder des Berlin Track Clubs.',
  ogTitle: 'BTC Wettkampfanmeldung',
  ogDescription:
      'Die LADV-Wettkampf-Anmeldung für Mitglieder des Berlin Track Clubs.',
  ogImage: '/logo-yellow.svg',
  twitterTitle: 'BTC Wettkampfanmeldung',
  twitterDescription:
      'Die LADV-Wettkampf-Anmeldung für Mitglieder des Berlin Track Clubs.',
  twitterImage: '/logo-yellow.svg',
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

// async function logout() {
//   await $fetch('/api/auth/logout', { method: 'POST' })
//   await clear()
// }
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
          <UIcon
            name="i-btc-logo"
            alt="BTC Logo"
            class="size-14 text-yellow-500 transform transition-transform duration-300 group-hover:scale-110"
          />
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
      icon="i-btc-logo"
      type="dotted"
      size="sm"
      :ui="{ icon: 'size-14' }"
    />

    <UFooter class="mb-4">
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
