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
      class="hover:text-primary group relative px-2 py-1 font-medium tracking-wider transition-colors"
      :class="{ 'text-primary': $route.path === to }"
    >
      {{ label }}
      <span
        class="bg-primary-500 absolute bottom-0 left-0 h-0.5 w-full scale-x-0 transform transition-transform duration-300 group-hover:scale-x-100"
        :class="{ 'scale-x-100': $route.path === to }"
      />
    </NuxtLink>
  </li>
</template>
