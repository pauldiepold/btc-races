<script setup lang="ts">
const { login, loading, error } = useAuth()
</script>

<template>
  <div class="mx-auto max-w-lg rounded-lg bg-white p-6 shadow-sm">
    <h2 class="mb-6 text-center text-2xl font-bold">Admin Login</h2>

    <div class="space-y-4">
      <div v-if="error" class="text-sm text-red-500">
        {{ error }}
      </div>

      <BaseButton :disabled="loading" class="w-full" @click="login">
        {{ loading ? 'Wird eingeloggt...' : 'Mit Microsoft anmelden' }}
      </BaseButton>
      <p class="text-center text-sm text-gray-500">
        Zugriff ist nur mit einem BTC-Microsoft Account möglich.
      </p>
    </div>
  </div>
</template>
