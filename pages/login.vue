<script setup lang="ts">
const { login, loading, error } = useAuth()
</script>

<template>
  <NuxtLayout name="base" heading="">
    <div
      class="mx-auto max-w-lg space-y-4 rounded-lg bg-(--ui-bg-accented) p-6 shadow-sm"
    >
      <h2 class="text-center text-2xl font-bold">Admin Login</h2>

      <div v-if="error" class="text-sm text-red-500">
        {{ error }}
      </div>

      <UButton
        :disabled="loading"
        variant="solid"
        class="w-full cursor-pointer justify-center"
        size="lg"
        color="neutral"
        :label="loading ? 'Wird eingeloggt...' : 'Mit Microsoft anmelden'"
        @click="login"
      />
      <p class="text-center text-sm text-(--ui-text-dimmed)">
        Zugriff ist nur mit einem BTC-Microsoft Account möglich.
      </p>
    </div>
  </NuxtLayout>
</template>
