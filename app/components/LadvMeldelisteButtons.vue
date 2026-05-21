<script setup lang="ts">
const props = defineProps<{
  ladvId: number
  registerLabel?: string
}>()
</script>

<template>
  <div class="flex gap-2">
    <UButton
      :to="`https://ladv.de/meldung/addathlet/${props.ladvId}`"
      target="_blank"
      rel="noopener noreferrer"
      icon="i-ph-arrow-up-right-bold"
      :label="props.registerLabel ?? 'Zur LADV-Meldung'"
      color="neutral"
      variant="soft"
      size="sm"
    />
    <UButton
      :to="`https://ladv.de/meldung/anmeldungen/${props.ladvId}`"
      target="_blank"
      rel="noopener noreferrer"
      icon="i-ph-list"
      label="Zur LADV-Meldeliste"
      color="neutral"
      variant="ghost"
      size="sm"
    />
  </div>
</template>
