<script setup lang="ts">
const { clear, user, session } = useUserSession()
const colorMode = useColorMode()
const isOpen = ref(false)

const isAdmin = computed(() => session.value?.user?.role === 'admin' || session.value?.user?.role === 'superuser')
const avatarUrlSmall = computed(() => user.value?.id ? useAvatarUrl(user.value.id) : undefined)
const avatarAlt = computed(() => `${user.value?.firstName ?? ''} ${user.value?.lastName ?? ''}`)
const isSuperuser = computed(() => session.value?.user?.role === 'superuser')

const colorModeIcon = computed(() =>
  colorMode.value === 'dark' ? 'i-ph-moon-bold' : 'i-ph-sun-bold',
)

withDefaults(defineProps<{ expanded?: boolean }>(), { expanded: false })

async function logout() {
  isOpen.value = false
  await $fetch('/api/auth/logout', { method: 'POST' })
  await clear()
  await navigateTo('/login')
}
</script>

<template>
  <AuthState v-slot="{ loggedIn }">
    <div v-if="loggedIn">
      <template v-if="expanded">
        <div class="flex items-center gap-4 pb-4 border-b border-default">
          <UAvatar
            :src="avatarUrlSmall"
            :alt="avatarAlt"
            size="2xl"
            :ui="{ root: 'ring ring-primary shrink-0' }"
          />
          <div class="min-w-0">
            <p class="font-display font-semibold text-highlighted text-lg leading-snug truncate">
              {{ user?.firstName }} {{ user?.lastName }}
            </p>
            <p class="text-sm text-muted truncate mt-0.5">
              {{ user?.email }}
            </p>
          </div>
        </div>

        <div class="py-4 border-b border-default space-y-3">
          <NuxtLink
            to="/meine-anmeldungen"
            class="flex items-center gap-3 text-sm text-default hover:text-primary transition-colors"
            @click="isOpen = false"
          >
            <UIcon
              name="i-ph-calendar-check-bold"
              class="size-5 text-muted shrink-0"
            />
            Meine Anmeldungen
          </NuxtLink>
          <NuxtLink
            v-if="isAdmin"
            to="/admin"
            class="flex items-center gap-3 text-sm text-default hover:text-primary transition-colors"
            @click="isOpen = false"
          >
            <UIcon
              name="i-ph-shield-check-bold"
              class="size-5 text-muted shrink-0"
            />
            Admin
          </NuxtLink>
          <NuxtLink
            v-if="isSuperuser"
            to="/superuser"
            class="flex items-center gap-3 text-sm text-default hover:text-primary transition-colors"
            @click="isOpen = false"
          >
            <UIcon
              name="i-ph-key-bold"
              class="size-5 text-muted shrink-0"
            />
            Superuser
          </NuxtLink>
        </div>

        <div class="flex items-center gap-3 py-4 border-b border-default">
          <UIcon
            :name="colorModeIcon"
            class="size-5 text-muted shrink-0"
          />
          <span class="text-sm text-default flex-1">Darstellung</span>
          <div class="flex items-center rounded-[--ui-radius] bg-accented p-0.5">
            <button
              class="px-3 py-1.5 text-xs rounded-[--ui-radius] font-medium transition-colors cursor-pointer"
              :class="colorMode.value === 'light' ? 'bg-default text-highlighted shadow-sm' : 'text-muted hover:text-default'"
              @click="colorMode.preference = 'light'"
            >
              Light
            </button>
            <button
              class="px-3 py-1.5 text-xs rounded-[--ui-radius] font-medium transition-colors cursor-pointer"
              :class="colorMode.value === 'dark' ? 'bg-default text-highlighted shadow-sm' : 'text-muted hover:text-default'"
              @click="colorMode.preference = 'dark'"
            >
              Dark
            </button>
          </div>
        </div>

        <div class="pt-4">
          <button
            class="flex items-center gap-3 text-sm text-muted hover:text-error transition-colors cursor-pointer"
            @click="logout"
          >
            <UIcon
              name="i-ph-sign-out-bold"
              class="size-5 shrink-0"
            />
            Ausloggen
          </button>
        </div>
      </template>

      <!-- ── Desktop / Header: popover trigger ─────────────────────── -->
      <UPopover
        v-else
        v-model:open="isOpen"
        :content="{ align: 'end', side: 'bottom', sideOffset: 10 }"
      >
        <UButton
          color="neutral"
          variant="ghost"
          size="lg"
          class="group data-[state=open]:bg-elevated"
        >
          <template #leading>
            <UAvatar
              :src="avatarUrlSmall"
              :alt="avatarAlt"
              size="md"
              :ui="{ root: 'ring ring-primary' }"
            />
          </template>
          <span class="font-display font-semibold tracking-tight">{{ user?.firstName }}</span>
          <template #trailing>
            <UIcon
              :name="isOpen ? 'i-ph-caret-up-bold' : 'i-ph-caret-down-bold'"
              class="size-5 text-primary transition-transform duration-200"
            />
          </template>
        </UButton>

        <template #content>
          <div class="w-72 overflow-hidden">
            <!-- Yellow accent stripe -->
            <div class="h-0.5 bg-primary" />

            <!-- User card -->
            <div class="px-4 py-4 flex items-center gap-4">
              <UAvatar
                :src="avatarUrlSmall"
                :alt="avatarAlt"
                size="2xl"
                :ui="{ root: 'ring-2 ring-primary shrink-0' }"
              />
              <div class="min-w-0">
                <p class="font-display font-semibold text-highlighted text-base leading-snug truncate">
                  {{ user?.firstName }} {{ user?.lastName }}
                </p>
                <p class="text-xs text-muted truncate mt-0.5">
                  {{ user?.email }}
                </p>
              </div>
            </div>

            <div class="h-px bg-border mx-4" />

            <!-- Meine Anmeldungen + Admin-Links -->
            <div class="p-2">
              <NuxtLink
                to="/meine-anmeldungen"
                class="flex items-center gap-3 px-3 py-2.5 rounded-[--ui-radius] text-sm text-default hover:text-primary hover:bg-primary/10 transition-colors"
                @click="isOpen = false"
              >
                <UIcon
                  name="i-ph-calendar-check-bold"
                  class="size-5 shrink-0"
                />
                Meine Anmeldungen
              </NuxtLink>
              <NuxtLink
                v-if="isAdmin"
                to="/admin"
                class="flex items-center gap-3 px-3 py-2.5 rounded-[--ui-radius] text-sm text-default hover:text-primary hover:bg-primary/10 transition-colors"
                @click="isOpen = false"
              >
                <UIcon
                  name="i-ph-shield-check-bold"
                  class="size-5 shrink-0"
                />
                Admin
              </NuxtLink>
              <NuxtLink
                v-if="isSuperuser"
                to="/superuser"
                class="flex items-center gap-3 px-3 py-2.5 rounded-[--ui-radius] text-sm text-default hover:text-primary hover:bg-primary/10 transition-colors"
                @click="isOpen = false"
              >
                <UIcon
                  name="i-ph-key-bold"
                  class="size-5 shrink-0"
                />
                Superuser
              </NuxtLink>
            </div>

            <div class="h-px bg-border mx-4" />

            <!-- Color mode toggle -->
            <div class="px-4 py-3 flex items-center gap-3">
              <UIcon
                :name="colorModeIcon"
                class="size-5 text-muted shrink-0"
              />
              <span class="text-sm text-default flex-1">Darstellung</span>
              <div class="flex items-center rounded-[--ui-radius] bg-accented p-0.5">
                <button
                  class="px-2.5 py-1 text-xs rounded-[--ui-radius] font-medium transition-colors cursor-pointer"
                  :class="colorMode.value === 'light' ? 'bg-default text-highlighted shadow-sm' : 'text-muted hover:text-default'"
                  @click="colorMode.preference = 'light'"
                >
                  Light
                </button>
                <button
                  class="px-2.5 py-1 text-xs rounded-[--ui-radius] font-medium transition-colors cursor-pointer"
                  :class="colorMode.value === 'dark' ? 'bg-default text-highlighted shadow-sm' : 'text-muted hover:text-default'"
                  @click="colorMode.preference = 'dark'"
                >
                  Dark
                </button>
              </div>
            </div>

            <div class="h-px bg-border mx-4" />

            <!-- Logout -->
            <div class="p-2">
              <button
                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-[--ui-radius] text-sm text-default hover:text-error hover:bg-error/10 transition-colors cursor-pointer"
                @click="logout"
              >
                <UIcon
                  name="i-ph-sign-out-bold"
                  class="size-5 shrink-0"
                />
                Ausloggen
              </button>
            </div>
          </div>
        </template>
      </UPopover>
    </div>
  </AuthState>
</template>
