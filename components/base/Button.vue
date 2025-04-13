<script setup>
import { computed } from 'vue'

const props = defineProps({
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
})

const variantClasses = {
  filled: {
    primary:
      'bg-primary border border-primary rounded-lg text-black hover:bg-primary-hover transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50',
    secondary:
      'bg-secondary border border-secondary rounded-lg text-white hover:bg-secondary-hover transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50',
  },
  outline: {
    primary:
      'bg-white border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50',
    secondary:
      'bg-white border border-secondary rounded-lg text-secondary hover:bg-secondary hover:text-white transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50',
  },
  text: {
    primary: 'text-primary transition-colors duration-300 hover:underline',
    secondary: 'text-secondary transition-colors duration-300 hover:underline',
  },
}

const buttonClass = computed(() => {
  return variantClasses[props.variant][props.color]
})
</script>

<template>
  <button class="cursor-pointer px-4 py-1.5" :class="buttonClass">
    <slot />
  </button>
</template>
