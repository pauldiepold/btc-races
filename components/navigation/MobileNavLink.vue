<script setup lang="ts">
interface Props {
  to: string
  label: string
  isMenuOpen: boolean
}

interface Emits {
  (e: 'closeMenu'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<template>
  <li>
    <NuxtLink
      :to="to"
      class="block text-white hover:text-[#ffb700] transition-colors duration-300 py-2"
      @click="emit('closeMenu')"
    >
      {{ label }}
    </NuxtLink>
  </li>
</template>
