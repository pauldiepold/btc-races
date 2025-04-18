<script setup lang="ts">
import { de } from '@nuxt/ui/locale'
import BTC_Logo_yellow from '~/assets/images/BTC_Logo_yellow_padding.png'

useSeoMeta({
  description:
    'Die LADV-Wettkampf-Anmeldung für Mitglieder des Berlin Track Clubs.',
  ogTitle: 'BTC Wettkampfanmeldung',
  ogDescription:
    'Die LADV-Wettkampf-Anmeldung für Mitglieder des Berlin Track Clubs.',
  ogImage: BTC_Logo_yellow,
  twitterTitle: 'BTC Wettkampfanmeldung',
  twitterDescription:
    'Die LADV-Wettkampf-Anmeldung für Mitglieder des Berlin Track Clubs.',
  twitterImage: BTC_Logo_yellow,
  twitterCard: 'summary',
})

useHead({
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
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
