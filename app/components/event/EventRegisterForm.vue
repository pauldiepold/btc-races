<script setup lang="ts">
import type { EventDetail } from '~~/shared/types/events'

defineProps<{ event: EventDetail }>()
</script>

<template>
  <!-- TODO 9.8: Anmeldeformular -->
  <div class="rounded-[--ui-radius] border border-dashed border-default p-5 text-center text-sm text-muted space-y-1">
    <UIcon
      name="i-ph-user-plus"
      class="size-6 mx-auto opacity-40"
    />
    <p>Anmeldung folgt in Kürze.</p>
  </div>
</template>
