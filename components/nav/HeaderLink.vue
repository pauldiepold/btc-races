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
})
</script>

<template>
  <li>
    <NuxtLink
      :to="to"
      class="relative group px-2 py-1 hover:text-[#ffb700] transition-colors tracking-wider font-medium"
      :class="{ 'text-[#ffb700]': $route.path === to }"
    >
      {{ label }}
      <span
        class="absolute bottom-0 left-0 w-full h-0.5 bg-[#ffb700] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
        :class="{ 'scale-x-100': $route.path === to }"
      />
    </NuxtLink>
  </li>
</template>
