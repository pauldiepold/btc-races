<script setup lang="ts">
defineProps<{
  priority?: 'A' | 'B' | 'C' | null
}>()
</script>

<template>
  <span
    v-if="priority"
    class="shrink-0 inline-flex items-center justify-center size-4.5 rounded text-primary bg-primary/15 font-black text-xs leading-none"
  >{{ priority }}</span>
</template>
