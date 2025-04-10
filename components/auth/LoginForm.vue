<script setup lang="ts">
const { login, loading, error } = useAuth()
</script>

<template>
  <div class="bg-white rounded-lg shadow-sm p-6 max-w-lg mx-auto">
    <h2 class="text-2xl font-bold mb-6 text-center">
      Admin Login
    </h2>

    <div class="space-y-4">
      <div v-if="error" class="text-red-500 text-sm">
        {{ error }}
      </div>

      <BaseButton
        :disabled="loading"
        class="w-full"
        @click="login"
      >
        {{ loading ? 'Wird eingeloggt...' : 'Mit Microsoft anmelden' }}
      </BaseButton>
      <p class="text-sm text-gray-500 text-center">
        Zugriff ist nur mit einem BTC-Microsoft Account möglich.
      </p>
    </div>
  </div>
</template>
