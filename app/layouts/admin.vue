<script setup lang="ts">
const { session } = useUserSession()
if (session.value?.user?.role !== 'admin' && session.value?.user?.role !== 'superuser') {
  await navigateTo('/')
}

const route = useRoute()
const router = useRouter()

const tabs = [
  { label: 'LADV-Todos', value: 'ladv-todos', icon: 'i-ph-list-checks' },
  { label: 'Avatare', value: 'avatare', icon: 'i-ph-users-four' },
]

const activeTab = computed({
  get: () => route.path.split('/').pop() === 'avatare' ? 'avatare' : 'ladv-todos',
  set: (value: string) => router.push(`/admin/${value}`),
})
</script>

<template>
  <UContainer class="py-10 lg:py-14 max-w-5xl">
    <div class="mb-8">
      <h1 class="font-display font-semibold text-highlighted text-2xl mb-5">
        Admin
      </h1>
      <UTabs
        v-model="activeTab"
        :items="tabs"
        :content="false"
        variant="link"
        color="neutral"
      />
    </div>
    <slot />
  </UContainer>
</template>
