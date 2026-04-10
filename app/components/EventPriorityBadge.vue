<script setup lang="ts">
defineProps<{
  priority?: 'A' | 'B' | 'C' | null
}>()
</script>

<template>
  <UBadge
    v-if="priority"
    :label="priority"
    color="primary"
    variant="solid"
    size="xs"
    class="shrink-0 font-bold tabular-nums"
  />
</template>
