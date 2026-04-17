<script setup lang="ts">
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'
import * as z from 'zod'

const { loggedIn } = useUserSession()
const route = useRoute()
const loading = ref(false)
const turnstileToken = ref('')
const turnstile = ref()

definePageMeta({
  title: 'Login',
  colorMode: 'dark',
})

// Weiterleitung zur Homepage, wenn bereits eingeloggt
watch(loggedIn, (isLoggedIn) => {
  if (isLoggedIn) {
    navigateTo('/')
  }
}, { immediate: true })

const fields: AuthFormField[] = [{
  name: 'email',
  type: 'email',
  label: 'E-Mail-Adresse',
  placeholder: '',
  required: true,
}]

const schema = z.object({
  email: z.email('Bitte gib eine gültige E-Mail-Adresse ein'),
})

type Schema = z.output<typeof schema>

const formError = ref<string | null>(null)

const loadingMessages = [
  'Link wird generiert...',
  'E-Mail wird gesendet...',
  'Gleich da...',
]
const loadingMessageIndex = ref(0)
let messageInterval: ReturnType<typeof setInterval> | null = null

watch(loading, (isLoading) => {
  if (isLoading) {
    loadingMessageIndex.value = 0
    messageInterval = setInterval(() => {
      if (loadingMessageIndex.value < loadingMessages.length - 1) {
        loadingMessageIndex.value++
      }
    }, 900)
  }
  else {
    if (messageInterval) {
      clearInterval(messageInterval)
      messageInterval = null
    }
  }
})

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  formError.value = null

  if (!turnstileToken.value) {
    formError.value = 'Die Sicherheitsprüfung ist noch nicht abgeschlossen. Bitte warte einen Moment.'
    return
  }

  loading.value = true
  try {
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : undefined
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        email: payload.data.email,
        turnstileToken: turnstileToken.value,
        ...(redirect ? { redirect } : {}),
      },
    })

    navigateTo('/link-gesendet')
  }
  catch (e: unknown) {
    turnstile.value?.reset()
    formError.value = (e as { data?: { message?: string } })?.data?.message
      ?? (e instanceof Error ? e.message : 'Ein unbekannter Fehler ist aufgetreten.')
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4">
    <UPageCard class="w-full max-w-md anim-card">
      <UAuthForm
        :schema="schema"
        title="Login"
        description="Gib deine beim BTC hinterlegte E-Mail-Adresse an."
        icon="i-btc-logo"
        :fields="fields"
        :submit="{
          label: 'Anmelde-Link senden',
          block: true,
        }"
        :loading="loading"
        @submit="onSubmit"
      >
        <template #validation>
          <UAlert
            v-if="formError"
            color="error"
            variant="subtle"
            close
            icon="i-lucide-circle-alert"
            :description="formError"
          />
        </template>
        <template #footer>
          <NuxtTurnstile
            ref="turnstile"
            v-model="turnstileToken"
            :options="{ appearance: 'interaction-only' }"
          />
        </template>
      </UAuthForm>
      <Transition name="loading-container">
        <div
          v-if="loading"
          class="text-center mt-4"
        >
          <Transition
            name="loading-msg"
            mode="out-in"
          >
            <span
              :key="loadingMessageIndex"
              class="text-sm text-zinc-400"
            >
              {{ loadingMessages[loadingMessageIndex] }}
            </span>
          </Transition>
        </div>
      </Transition>
    </UPageCard>
  </div>
</template>

<style scoped>
@keyframes card-in {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.anim-card {
  animation: card-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.loading-container-enter-active {
  transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.loading-container-leave-active {
  transition: opacity 0.2s cubic-bezier(0.7, 0, 0.84, 0), transform 0.2s cubic-bezier(0.7, 0, 0.84, 0);
}
.loading-container-enter-from,
.loading-container-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

.loading-msg-enter-active {
  transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.loading-msg-leave-active {
  transition: opacity 0.18s cubic-bezier(0.7, 0, 0.84, 0), transform 0.18s cubic-bezier(0.7, 0, 0.84, 0);
}
.loading-msg-enter-from {
  opacity: 0;
  transform: translateY(5px);
}
.loading-msg-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

@media (prefers-reduced-motion: reduce) {
  .anim-card {
    animation-duration: 0.01ms !important;
  }

  .loading-container-enter-active,
  .loading-container-leave-active,
  .loading-msg-enter-active,
  .loading-msg-leave-active {
    transition-duration: 0.01ms !important;
  }
}
</style>
