<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const { clear, user } = useUserSession()

async function logout() {
  await $fetch('/auth/logout', { method: 'POST' })
  await clear()
  await navigateTo('/auth/login')
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
      label: 'Profil',
      icon: 'i-lucide-user',
    },
    {
      label: 'Einstellungen',
      icon: 'i-lucide-settings',
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

        <template #chip-leading="{ item }">
          <div class="inline-flex items-center justify-center shrink-0 size-5">
            <span
              class="rounded-full ring ring-bg bg-(--chip-light) dark:bg-(--chip-dark) size-2"
              :style="{
                '--chip-light': `var(--color-${(item as any).chip}-500)`,
                '--chip-dark': `var(--color-${(item as any).chip}-400)`,
              }"
            />
          </div>
        </template>
      </UDropdownMenu>
    </AuthState>
  </div>
</template>
