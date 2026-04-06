<script setup lang="ts">
import { ladvDisciplineLabel, ladvAgeClassLabel } from '~~/shared/utils/ladv-labels'

const props = defineProps<{
  discipline?: string
  ageClass?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  variant?: 'outline' | 'subtle' | 'solid' | 'soft'
}>()

const label = computed(() => {
  const parts: string[] = []
  if (props.discipline) parts.push(ladvDisciplineLabel(props.discipline))
  if (props.ageClass) parts.push(ladvAgeClassLabel(props.ageClass))
  return parts.join(' · ')
})
</script>

<template>
  <UBadge
    :label="label"
    color="neutral"
    :variant="variant ?? 'outline'"
    :size="size ?? 'sm'"
  />
</template>
