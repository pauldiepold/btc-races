<script setup lang="ts">
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'
import * as z from 'zod'

const { loggedIn } = useUserSession()
const loading = ref(false)

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

const toast = useToast()

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
  loading.value = true
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email: payload.data.email },
    })

    navigateTo('/link-gesendet')
  }
  catch (e) {
    const description = e instanceof Error ? e.message : 'Ein unbekannter Fehler ist aufgetreten.'
    toast.add({
      title: 'Fehler',
      description,
      color: 'error',
    })
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4">
    <UPageCard class="w-full max-w-md">
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
      />
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
.loading-container-enter-active,
.loading-container-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.loading-container-enter-from,
.loading-container-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

.loading-msg-enter-active,
.loading-msg-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.loading-msg-enter-from {
  opacity: 0;
  transform: translateY(5px);
}
.loading-msg-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>
