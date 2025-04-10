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
      class="block px-4 py-2 hover:text-primary transition-colors rounded-lg hover:bg-gray-800 tracking-wider font-medium"
      :class="{ 'text-primary bg-gray-800': $route.path === to }"
      @click="emit('closeMenu')"
    >
      {{ label }}
    </NuxtLink>
  </li>
</template>
