<script setup lang="ts">
definePageMeta({ layout: 'admin', title: 'Admin — Avatare' })
</script>

<template>
  <div>
    <div class="mb-8 flex items-start justify-between gap-4">
      <p class="text-sm text-muted">
        Avatare von Campai laden, auf 64×64 und 128×128 px verkleinern und in D1 cachen.
      </p>
    </div>
    <AdminAvatarProcessor />
  </div>
</template>
