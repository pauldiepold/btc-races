<script setup lang="ts">
definePageMeta({
  colorMode: 'dark',
})
</script>

<template>
  <NuxtLayout
    name="base"
    heading="Mitglieder importieren"
    back-link="/admin"
    back-link-text="Zurück zum Admin-Dashboard"
  >
    <AdminMemberImport />
  </NuxtLayout>
</template>
