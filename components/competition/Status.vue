<script setup lang="ts">
import type { Database } from '~/types/database.types'

type Competition = Database['public']['Tables']['competitions']['Row']

const props = defineProps<{ competition: Competition }>()

const status = computed(() => getCompetitionStatus(props.competition))
</script>
<template>
  <div>
    <span
      class="100 rounded-full px-4 py-1 text-xs font-medium"
      :class="status.color"
    >
      {{ status.text }}
    </span>
  </div>
</template>
