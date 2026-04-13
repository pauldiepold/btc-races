<script setup lang="ts">
definePageMeta({ title: 'LADV importieren' })

const toast = useToast()
const loading = ref(false)
const url = ref('')

async function onSubmit() {
  if (!url.value.trim()) return
  loading.value = true
  try {
    const { id } = await $fetch<{ id: string }>('/api/events/ladv-import', {
      method: 'POST',
      body: { url: url.value.trim() },
    })
    await navigateTo(`/${id}`)
  }
  catch (e: unknown) {
    const err = e as { status?: number, statusMessage?: string, data?: { existingEventId?: string }, message?: string }
    if (err.status === 409 && err.data?.existingEventId) {
      toast.add({ title: 'Event bereits vorhanden', description: 'Du wirst zur bestehenden Veranstaltung weitergeleitet.', color: 'warning' })
      await navigateTo(`/${err.data.existingEventId}`)
    }
    else if (err.status === 502) {
      toast.add({ title: 'LADV nicht erreichbar', description: err.statusMessage ?? 'Bitte später erneut versuchen.', color: 'error' })
    }
    else {
      toast.add({ title: 'Fehler', description: err.message ?? 'Ein Fehler ist aufgetreten.', color: 'error' })
    }
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <UContainer class="py-10 max-w-xl">
    <div class="mb-8">
      <UButton
        to="/"
        icon="i-ph-arrow-left"
        label="Zurück"
        color="neutral"
        variant="ghost"
        size="sm"
        class="mb-4"
      />
      <h1 class="text-2xl font-bold tracking-tight text-highlighted">
        LADV importieren
      </h1>
      <p class="mt-2 text-sm text-muted">
        Füge eine LADV-Veranstaltungs-URL ein, um das Event automatisch anzulegen.
      </p>
    </div>

    <form
      class="space-y-5"
      @submit.prevent="onSubmit"
    >
      <UFormField
        label="LADV-URL"
        required
      >
        <UInput
          v-model="url"
          type="url"
          placeholder="https://ladv.de/ausschreibung/..."
          class="w-full"
          :disabled="loading"
        />
      </UFormField>

      <div class="flex justify-end gap-3">
        <UButton
          to="/"
          color="neutral"
          variant="ghost"
          label="Abbrechen"
        />
        <UButton
          type="submit"
          icon="i-ph-download-simple"
          label="Importieren"
          :loading="loading"
          :disabled="!url.trim()"
        />
      </div>
    </form>
  </UContainer>
</template>
