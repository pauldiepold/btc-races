<script setup>
defineProps({
  to: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  isMenuOpen: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['closeMenu'])
</script>

<template>
  <li>
    <NuxtLink
      :to="to"
      class="hover:text-primary block rounded-lg px-4 py-2 font-medium tracking-wider transition-colors hover:bg-gray-800"
      :class="{ 'text-primary bg-gray-800': $route.path === to }"
      @click="emit('closeMenu')"
    >
      {{ label }}
    </NuxtLink>
  </li>
</template>
