<script setup>
defineProps({
  to: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary'].includes(value),
  },
  variant: {
    type: String,
    default: 'filled',
    validator: (value) => ['filled', 'outline', 'text'].includes(value),
  },
  buttonClass: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <NuxtLink :to="to">
    <BaseButton :color="color" :variant="variant" :class="buttonClass">
      <slot />
    </BaseButton>
  </NuxtLink>
</template>
