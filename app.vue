<script setup lang="ts">
import { de } from '@nuxt/ui/locale'
</script>

<template>
  <UApp
    :locale="de"
    :toaster="{
      position: 'top-center',
      duration: 3000,
    }"
  >
    <NuxtPage />
  </UApp>
</template>
