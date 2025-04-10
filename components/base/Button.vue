<script setup>
defineProps({
  color: {
    type: String,
    default: 'primary',
  },
  variant: {
    type: String,
    default: 'filled',
    validator: value => ['filled', 'text'].includes(value),
  },
})
</script>

<template>
  <button
    :class="[
      variant === 'filled'
        ? `bg-${color} cursor-pointer text-black px-4 py-2 rounded-lg hover:bg-${color} transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed`
        : `text-${color} cursor-pointer hover:underline transition-colors duration-300`,
    ]"
  >
    <slot />
  </button>
</template>
