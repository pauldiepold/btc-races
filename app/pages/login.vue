<script setup lang="ts">
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'
import * as z from 'zod'

const { loggedIn } = useUserSession()
const loading = ref(false)
const message = ref('')

definePageMeta({
  title: 'Login',
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

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  loading.value = true
  message.value = ''
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email: payload.data.email },
    })

    navigateTo('/link-gesendet')
  }
  catch {
    const errorMessage = 'Ein Fehler ist aufgetreten.'
    message.value = errorMessage
    toast.add({
      title: 'Fehler',
      description: errorMessage,
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
        icon="i-lucide-user"
        :fields="fields"
        :submit="{
          label: 'Anmelde-Link senden',
          variant: 'subtle',
          loading: loading,
        }"
        :loading="loading"
        @submit="onSubmit"
      />
    </UPageCard>
  </div>
<!--  <UContainer class="py-10"> -->
<!--    <UCard class="max-w-md mx-auto"> -->
<!--      <template #header> -->
<!--        <h3 class="text-xl font-bold"> -->
<!--          Login -->
<!--        </h3> -->
<!--      </template> -->

<!--      <UForm -->
<!--        :schema="schema" -->
<!--        :state="state" -->
<!--        class="space-y-4" -->
<!--        @submit="onSubmit" -->
<!--      > -->
<!--        <UFormField -->
<!--          label="E-Mail Adresse" -->
<!--          name="email" -->
<!--          required -->
<!--        > -->
<!--          <UInput -->
<!--            v-model="state.email" -->
<!--            type="email" -->
<!--            placeholder="deine@email.de" -->
<!--            :disabled="loading" -->
<!--          /> -->
<!--        </UFormField> -->

<!--        <UButton -->
<!--          type="submit" -->
<!--          block -->
<!--          :loading="loading" -->
<!--        > -->
<!--          Anmelde-Link senden -->
<!--        </UButton> -->
<!--      </UForm> -->

<!--      <p -->
<!--        v-if="message" -->
<!--        class="mt-4 text-sm text-center text-gray-600" -->
<!--      > -->
<!--        {{ message }} -->
<!--      </p> -->
<!--    </UCard> -->
<!--  </UContainer> -->
</template>
