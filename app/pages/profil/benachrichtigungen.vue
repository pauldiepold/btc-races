<script setup lang="ts">
definePageMeta({ layout: 'profil', title: 'Benachrichtigungen' })
</script>

<template>
  <div>
    <h2 class="font-display font-semibold text-highlighted text-lg mb-6">
      Benachrichtigungen
    </h2>

    <div class="text-center py-14 text-muted space-y-2">
      <UIcon
        name="i-ph-bell-bold"
        class="size-10 mx-auto opacity-30"
      />
      <p class="text-sm">
        Hier kannst du bald deine Benachrichtigungen konfigurieren.
      </p>
    </div>
  </div>
</template>
