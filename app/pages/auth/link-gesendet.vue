<script setup lang="ts">
definePageMeta({
  title: 'Anmelde-Link gesendet',
})

const { loggedIn } = useUserSession()

// Weiterleitung zur Homepage, wenn bereits eingeloggt
watch(loggedIn, (isLoggedIn) => {
  if (isLoggedIn) {
    navigateTo('/')
  }
}, { immediate: true })
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4">
    <UPageCard class="w-full max-w-md">
      <div class="flex flex-col items-center gap-4 text-center">
        <UIcon
          name="i-lucide-mail-check"
          class="size-16 text-primary"
        />
        <h2 class="text-2xl font-bold">
          Anmelde-Link gesendet
        </h2>
        <p class="text-gray-400">
          Wir haben dir einen Anmelde-Link per E-Mail zugeschickt. Klicke auf den Link in der E-Mail, um dich anzumelden.
        </p>
        <p class="text-sm text-gray-500">
          Der Link ist 15 Minuten gültig.
        </p>
        <UButton
          to="/auth/login"
          variant="subtle"
          class="mt-4"
        >
          Zurück zum Login
        </UButton>
      </div>
    </UPageCard>
  </div>
</template>
