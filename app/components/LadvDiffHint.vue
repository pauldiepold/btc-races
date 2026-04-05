<script setup lang="ts">
defineProps<{
  value: string
}>()

defineEmits<{
  apply: []
}>()
</script>

<template>
  <div class="flex items-center gap-2 mt-1.5">
    <span class="text-xs text-muted">
      LADV: <span class="font-medium text-highlighted">{{ value }}</span>
    </span>
    <UButton
      size="xs"
      color="neutral"
      variant="ghost"
      label="Übernehmen"
      @click="$emit('apply')"
    />
  </div>
</template>
