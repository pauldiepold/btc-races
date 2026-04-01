<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const { clear, user } = useUserSession()

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await clear()
  await navigateTo('/login')
}

const colorMode = useColorMode()

const items = computed<DropdownMenuItem[][]>(() => ([
  [
    {
      type: 'label',
      label: user.value?.firstName,
      avatar: { src: user.value?.avatarUrl },
    },
  ],
  [
    {
      label: 'Darstellung',
      icon: 'i-lucide-sun-moon',
      children: [{
        label: 'Light',
        icon: 'i-lucide-sun',
        type: 'checkbox',
        checked: colorMode.value === 'light',
        onSelect(e: Event) {
          e.preventDefault()

          colorMode.preference = 'light'
        },
      }, {
        label: 'Dark',
        icon: 'i-lucide-moon',
        type: 'checkbox',
        checked: colorMode.value === 'dark',
        onUpdateChecked(checked: boolean) {
          if (checked) {
            colorMode.preference = 'dark'
          }
        },
        onSelect(e: Event) {
          e.preventDefault()
        },
      }],
    },
  ],
  [
    {
      label: 'Ausloggen',
      icon: 'i-lucide-log-out',
      onSelect() {
        logout()
      },
    },
  ]]))
</script>

<template>
  <div>
    <AuthState v-slot="{ loggedIn }">
      <UDropdownMenu
        v-if="loggedIn"
        :items="items"
        :content="{ align: 'center', collisionPadding: 12 }"
        :ui="{ content: 'w-[90vw] md:w-60 lg:w-auto' }"
      >
        <UButton
          :avatar="{
            src: user?.avatarUrl,
          }"
          :label="user?.firstName"
          trailing-icon="i-lucide-chevrons-up-down"
          color="neutral"
          variant="ghost"
          block
          size="lg"
          class="data-[state=open]:bg-elevated"
          :ui="{
            trailingIcon: 'text-dimmed',
          }"
        />
      </UDropdownMenu>
    </AuthState>
  </div>
</template>
