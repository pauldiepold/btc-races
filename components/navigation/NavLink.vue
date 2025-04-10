<script setup lang="ts">
interface Props {
  to: string
  label: string
}

defineProps<Props>()
</script>

<template>
  <li>
    <NuxtLink
      :to="to"
      class="text-white hover:text-[#ffb700] transition-colors duration-300 relative group"
    >
      {{ label }}
      <span class="absolute -bottom-1 left-0 w-full h-0.5 bg-[#ffb700] transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
    </NuxtLink>
  </li>
</template>
