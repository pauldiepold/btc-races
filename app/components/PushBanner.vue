<script setup lang="ts">
const { loggedIn } = useUserSession()
const push = usePushNotifications()

const modalOpen = ref(false)

onMounted(() => {
  push.init()
})

const visible = computed(() =>
  loggedIn.value
  && push.isSupported.value
  && !push.isSubscribed.value
  && !push.bannerDismissed.value,
)
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-200 ease-out"
    enter-from-class="opacity-0 -translate-y-2"
    leave-active-class="transition-all duration-150 ease-in"
    leave-to-class="opacity-0 -translate-y-2"
  >
    <div
      v-if="visible"
      class="border-b border-yellow-500/30 bg-yellow-500/10"
    >
      <UContainer class="flex items-center gap-3 py-2">
        <UIcon
          name="i-ph-bell-ringing-bold"
          class="size-5 text-primary shrink-0"
        />
        <p class="text-sm text-highlighted flex-1 min-w-0">
          <span class="font-medium">Push-Benachrichtigungen aktivieren</span>
          <span class="text-muted hidden sm:inline"> — Verpasse keine LADV-Meldungen und Wettkampf-Erinnerungen.</span>
        </p>
        <UButton
          label="Aktivieren"
          color="primary"
          size="sm"
          @click="modalOpen = true"
        />
        <UButton
          icon="i-ph-x"
          color="neutral"
          variant="ghost"
          size="sm"
          aria-label="Banner schließen"
          @click="push.dismissBanner()"
        />
      </UContainer>
      <PushModal v-model:open="modalOpen" />
    </div>
  </Transition>
</template>
