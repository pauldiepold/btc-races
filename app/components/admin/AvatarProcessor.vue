<script setup lang="ts">
interface UserAvatarItem {
  id: string
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
  avatarCached: 0 | 1
  avatarNeedsResync: 0 | 1
}

type ProcessStatus = 'idle' | 'processing' | 'done' | 'outdated' | 'no-avatar' | 'error'

interface UserState extends UserAvatarItem {
  status: ProcessStatus
  errorMessage?: string
}

const { data: users, status: fetchStatus } = await useFetch<UserAvatarItem[]>('/api/admin/users-with-avatar')

const userStates = ref<UserState[]>([])

watch(users, (val) => {
  if (val) {
    userStates.value = val.map(u => ({
      ...u,
      status: (u.avatarCached && u.avatarNeedsResync ? 'outdated' : u.avatarCached ? 'done' : 'idle') as ProcessStatus,
    }))
  }
}, { immediate: true })

const isProcessing = ref(false)

const progress = computed(() => ({
  done: userStates.value.filter(u => u.status === 'done').length,
  total: userStates.value.length,
}))

const errors = computed(() => userStates.value.filter(u => u.status === 'error'))
const processable = computed(() => userStates.value.filter(u => u.avatarUrl && u.status !== 'done' && u.status !== 'no-avatar'))
const outdated = computed(() => userStates.value.filter(u => u.status === 'outdated'))

function resizeToBase64(blob: Blob, size: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(blob)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      canvas.getContext('2d')!.drawImage(img, 0, 0, size, size)
      canvas.toBlob(
        (b) => {
          if (!b) {
            reject(new Error('Canvas toBlob fehlgeschlagen'))
            return
          }
          const reader = new FileReader()
          reader.onload = () => resolve((reader.result as string).split(',')[1]!)
          reader.onerror = () => reject(reader.error)
          reader.readAsDataURL(b)
        },
        'image/jpeg',
        quality,
      )
      URL.revokeObjectURL(url)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Bild konnte nicht geladen werden'))
    }
    img.src = url
  })
}

async function processUser(userState: UserState) {
  userState.status = 'processing'
  userState.errorMessage = undefined
  try {
    const buffer = await $fetch<ArrayBuffer>(`/api/admin/avatar-proxy/${userState.id}`, {
      responseType: 'arrayBuffer',
    })
    const blob = new Blob([buffer])
    const [small, large] = await Promise.all([
      resizeToBase64(blob, 64, 0.80),
      resizeToBase64(blob, 128, 0.85),
    ])
    await $fetch(`/api/admin/avatar-save/${userState.id}`, {
      method: 'POST',
      body: { small, large },
    })
    userState.status = 'done'
  }
  catch (e: unknown) {
    if (e && typeof e === 'object' && 'statusCode' in e && e.statusCode === 404) {
      userState.status = 'no-avatar'
    }
    else {
      userState.status = 'error'
      userState.errorMessage = e instanceof Error ? e.message : 'Unbekannter Fehler'
    }
  }
}

async function processAll() {
  isProcessing.value = true
  const toProcess = userStates.value.filter(u => u.avatarUrl && u.status !== 'done' && u.status !== 'no-avatar')
  for (const user of toProcess) {
    await processUser(user)
  }
  isProcessing.value = false
}

function fullName(user: UserState): string {
  return [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Unbekannt'
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <p class="text-sm text-muted">
          {{ progress.done }}/{{ progress.total }} gecacht
        </p>
        <UBadge
          v-if="outdated.length"
          :label="`${outdated.length} veraltet`"
          color="warning"
          variant="subtle"
          size="sm"
          icon="i-ph-arrow-clockwise"
        />
      </div>
      <UButton
        icon="i-ph-play"
        label="Alle verarbeiten"
        color="primary"
        :loading="isProcessing"
        :disabled="isProcessing || processable.length === 0"
        @click="processAll()"
      />
    </div>

    <!-- Laden -->
    <div
      v-if="fetchStatus === 'pending'"
      class="space-y-3"
    >
      <USkeleton
        v-for="i in 5"
        :key="i"
        class="h-14 w-full"
      />
    </div>

    <!-- Leer -->
    <div
      v-else-if="!userStates.length"
      class="text-center py-20 text-muted space-y-3"
    >
      <UIcon
        name="i-ph-users"
        class="size-12 mx-auto opacity-60"
      />
      <p class="font-medium text-highlighted">
        Keine User mit Avatar-URL gefunden
      </p>
    </div>

    <!-- Fehler-Summary -->
    <div
      v-if="errors.length && !isProcessing"
      class="mb-6 p-4 rounded-[--ui-radius] bg-error/10 border border-error/30"
    >
      <p class="text-sm font-medium text-error mb-2">
        {{ errors.length }} Fehler:
      </p>
      <ul class="text-sm text-error space-y-1">
        <li
          v-for="u in errors"
          :key="u.id"
        >
          {{ fullName(u) }}: {{ u.errorMessage }}
        </li>
      </ul>
    </div>

    <!-- Liste -->
    <div
      v-if="userStates.length"
      class="rounded-[--ui-radius] border border-default overflow-hidden"
    >
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-elevated border-b border-default">
            <th class="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
              Name
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
              Status
            </th>
            <th class="px-4 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">
              Aktion
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr
            v-for="user in userStates"
            :key="user.id"
            class="hover:bg-elevated/50 transition-colors"
          >
            <td class="px-4 py-3 font-medium text-highlighted">
              {{ fullName(user) }}
            </td>
            <td class="px-4 py-3">
              <UBadge
                v-if="user.status === 'done'"
                label="Gecacht"
                color="success"
                variant="subtle"
                size="sm"
                icon="i-ph-check"
              />
              <UBadge
                v-else-if="user.status === 'outdated'"
                label="Veraltet"
                color="warning"
                variant="subtle"
                size="sm"
                icon="i-ph-arrow-clockwise"
              />
              <UBadge
                v-else-if="user.status === 'processing'"
                label="Verarbeite…"
                color="info"
                variant="subtle"
                size="sm"
                icon="i-ph-spinner"
              />
              <UBadge
                v-else-if="user.status === 'no-avatar'"
                label="Kein Avatar"
                color="warning"
                variant="subtle"
                size="sm"
                icon="i-ph-image-broken"
              />
              <UBadge
                v-else-if="user.status === 'error'"
                label="Fehler"
                color="error"
                variant="subtle"
                size="sm"
                icon="i-ph-warning"
              />
              <UBadge
                v-else
                label="Ausstehend"
                color="neutral"
                variant="subtle"
                size="sm"
              />
            </td>
            <td class="px-4 py-3 text-right">
              <UButton
                v-if="user.avatarUrl && user.status !== 'processing' && user.status !== 'no-avatar'"
                :label="user.status === 'done' ? 'Erneut' : user.status === 'outdated' ? 'Neu cachen' : 'Verarbeiten'"
                :color="user.status === 'outdated' ? 'warning' : 'neutral'"
                variant="ghost"
                size="xs"
                :disabled="isProcessing"
                @click="processUser(user)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
