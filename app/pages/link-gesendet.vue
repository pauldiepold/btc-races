<script setup lang="ts">
definePageMeta({
  title: 'Anmelde-Link gesendet',
  colorMode: 'dark',
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
          name="i-ph-paper-plane-tilt-bold"
          class="size-16 text-primary anim-icon"
        />
        <h2
          class="text-2xl font-bold font-display anim-item"
          style="--delay: 80ms"
        >
          Anmelde-Link gesendet
        </h2>
        <p
          class="text-muted anim-item"
          style="--delay: 140ms"
        >
          Wir haben dir einen Anmelde-Link per E-Mail zugeschickt. Klicke auf den Link in der E-Mail, um dich anzumelden.
        </p>
        <p
          class="text-sm text-dimmed anim-item"
          style="--delay: 190ms"
        >
          Der Link ist 15 Minuten gültig.
        </p>
        <UButton
          to="/login"
          color="neutral"
          variant="outline"
          class="mt-4 anim-item"
          style="--delay: 240ms"
        >
          Zurück zum Login
        </UButton>
      </div>
    </UPageCard>
  </div>
</template>

<style scoped>
@keyframes fly-in {
  from {
    opacity: 0;
    transform: translate(8px, -8px) rotate(-12deg) scale(0.82);
  }
  to {
    opacity: 1;
    transform: translate(0, 0) rotate(0deg) scale(1);
  }
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.anim-icon {
  animation: fly-in 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.anim-item {
  animation: slide-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) var(--delay, 0ms) both;
}

@media (prefers-reduced-motion: reduce) {
  .anim-icon,
  .anim-item {
    animation-duration: 0.01ms !important;
    animation-delay: 0ms !important;
  }
}
</style>
