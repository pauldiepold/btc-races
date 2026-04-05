<script setup lang="ts">
defineProps<{ eventId: string }>()
</script>

<template>
  <!-- TODO 9.10: Kommentare -->
  <div>
    <h2 class="font-semibold text-highlighted mb-4">
      Kommentare
    </h2>
    <div class="py-8 text-center text-sm text-muted">
      <UIcon
        name="i-ph-chat-circle"
        class="size-8 mx-auto mb-2 opacity-40"
      />
      <p>Kommentare folgen in Kürze.</p>
    </div>
  </div>
</template>
