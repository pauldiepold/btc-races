<script setup lang="ts">
definePageMeta({
  title: 'Anmeldung bestätigt',
  colorMode: 'dark',
})
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4">
    <UPageCard class="w-full max-w-md">
      <div class="flex flex-col items-center gap-4 text-center">
        <UIcon
          name="i-ph-check-circle-bold"
          class="size-16 text-primary anim-icon"
        />
        <h2
          class="text-2xl font-bold font-display anim-item"
          style="--delay: 80ms"
        >
          Anmeldung bestätigt
        </h2>
        <p
          class="text-muted anim-item"
          style="--delay: 140ms"
        >
          Du kannst dieses Fenster schließen und zurück zur Berlin-Track-Club-App wechseln. Die App loggt dich automatisch ein.
        </p>
        <UButton
          to="/"
          color="neutral"
          variant="outline"
          class="mt-4 anim-item"
          style="--delay: 240ms"
        >
          Hier im Browser weiter
        </UButton>
      </div>
    </UPageCard>
  </div>
</template>

<style scoped>
@keyframes pop-in {
  from {
    opacity: 0;
    transform: scale(0.82);
  }
  to {
    opacity: 1;
    transform: scale(1);
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
  animation: pop-in 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
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
