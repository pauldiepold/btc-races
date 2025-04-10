<script setup>
defineProps({
  to: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    default: 'primary',
  },
})
</script>

<template>
  <NuxtLink :to="to">
    <BaseButton :color="color">
      <slot />
    </BaseButton>
  </NuxtLink>
</template>
