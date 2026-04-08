<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { EventDetail } from '~~/shared/types/events'
import { detectLadvDiff, type LadvDiff } from '~~/shared/utils/ladv'

definePageMeta({ title: 'Event bearbeiten' })

const route = useRoute()
const toast = useToast()
const id = route.params.id as string

const { data: event, status } = await useFetch<EventDetail>(`/api/events/${id}`, {
  onResponseError({ response }) {
    if (response.status === 404) {
      toast.add({ title: 'Event nicht gefunden', color: 'error' })
      navigateTo('/')
    }
  },
})

const { session } = useUserSession()

// Zugriffsschutz: nur Admin oder Ersteller
watchEffect(() => {
  if (status.value !== 'success' || !event.value) return
  const isAdmin = session.value?.user?.role === 'admin' || session.value?.user?.role === 'superuser'
  const isOwner = event.value.createdBy === session.value?.user?.id
  if (!isAdmin && !isOwner) {
    toast.add({ title: 'Kein Zugriff', description: 'Nur Admins oder der Ersteller können dieses Event bearbeiten.', color: 'error' })
    navigateTo(`/events/${id}`)
  }
})

const isLadv = computed(() => event.value?.type === 'ladv')
const isCompetitionOrLadv = computed(() => event.value?.type === 'competition' || event.value?.type === 'ladv')

const berlinFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Berlin',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function dateString(d: Date | string | null | undefined): string {
  if (!d) return ''
  if (typeof d === 'string') return d.slice(0, 10)
  return berlinFormatter.format(d)
}

const formSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  date: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  registrationDeadline: z.string().optional(),
  announcementLink: z.union([z.literal(''), z.string().url('Bitte eine gültige URL eingeben')]).optional(),
  raceType: z.string().optional(),
  championshipType: z.string().optional(),
})

type FormSchema = z.output<typeof formSchema>

const state = reactive<FormSchema>({
  name: '',
  date: '',
  location: '',
  description: '',
  registrationDeadline: '',
  announcementLink: '',
  raceType: undefined,
  championshipType: undefined,
})

// Formular mit Event-Daten vorbelegen, sobald geladen
watch(
  event,
  (e) => {
    if (!e) return
    state.name = e.name
    state.date = dateString(e.date)
    state.location = e.location ?? ''
    state.description = e.description ?? ''
    state.registrationDeadline = dateString(e.registrationDeadline)
    state.announcementLink = e.announcementLink ?? ''
    state.raceType = e.raceType ?? undefined
    state.championshipType = e.championshipType ?? undefined
  },
  { immediate: true },
)

// LADV-Diff live gegen den aktuellen Formular-State berechnen
const ladvDiff = computed<LadvDiff>(() => {
  if (!event.value?.ladvData) return {}
  return detectLadvDiff(
    {
      name: state.name,
      date: state.date || null,
      location: state.location || null,
      registrationDeadline: state.registrationDeadline || null,
      raceType: state.raceType ?? null,
    },
    event.value.ladvData,
  )
})

const raceTypeItems = [
  { label: 'Keine Angabe', value: undefined },
  { label: 'Bahn', value: 'track' },
  { label: 'Straße', value: 'road' },
]

const championshipItems = [
  { label: 'Keine Meisterschaft', value: undefined },
  { label: 'BBM', value: 'bbm' },
  { label: 'NDM', value: 'ndm' },
  { label: 'DM', value: 'dm' },
]

const loading = ref(false)

async function onSubmit(_formEvent: FormSubmitEvent<FormSchema>) {
  loading.value = true
  try {
    await $fetch(`/api/events/${id}`, {
      method: 'PATCH',
      body: {
        name: state.name,
        date: state.date || null,
        location: state.location || null,
        description: state.description || null,
        registrationDeadline: isCompetitionOrLadv.value ? (state.registrationDeadline || null) : null,
        announcementLink: isLadv.value ? undefined : (state.announcementLink || null),
        raceType: isCompetitionOrLadv.value ? (state.raceType || null) : null,
        championshipType: isLadv.value ? (state.championshipType || null) : null,
      },
    })
    toast.add({ title: 'Event gespeichert', color: 'success' })
    await navigateTo(`/events/${id}`)
  }
  catch {
    toast.add({ title: 'Fehler beim Speichern', color: 'error' })
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
        :to="`/events/${id}`"
        icon="i-ph-arrow-left"
        label="Zurück zum Event"
        color="neutral"
        variant="ghost"
        size="sm"
        class="mb-4"
      />
      <h1 class="text-2xl font-bold tracking-tight text-highlighted">
        Event bearbeiten
      </h1>
      <p
        v-if="event"
        class="text-sm text-muted mt-1"
      >
        {{ event.name }}
      </p>
    </div>

    <div
      v-if="status === 'pending'"
      class="space-y-4"
    >
      <USkeleton
        v-for="i in 5"
        :key="i"
        class="h-12 w-full"
      />
    </div>

    <UForm
      v-else-if="event"
      :schema="formSchema"
      :state="state"
      class="space-y-5"
      @submit="onSubmit"
    >
      <!-- Name -->
      <UFormField
        name="name"
        label="Name"
        required
      >
        <UInput
          v-model="state.name"
          class="w-full"
        />
        <LadvDiffHint
          v-if="ladvDiff.name"
          :value="ladvDiff.name"
          @apply="state.name = ladvDiff.name!"
        />
      </UFormField>

      <!-- Datum -->
      <UFormField
        name="date"
        label="Datum"
      >
        <UInput
          v-model="state.date"
          type="date"
          class="w-full"
        />
        <LadvDiffHint
          v-if="ladvDiff.date"
          :value="ladvDiff.date"
          @apply="state.date = ladvDiff.date!"
        />
      </UFormField>

      <!-- Ort -->
      <UFormField
        name="location"
        label="Ort"
      >
        <UInput
          v-model="state.location"
          class="w-full"
        />
        <LadvDiffHint
          v-if="ladvDiff.location"
          :value="ladvDiff.location"
          @apply="state.location = ladvDiff.location!"
        />
      </UFormField>

      <!-- Beschreibung -->
      <UFormField
        name="description"
        label="Beschreibung"
      >
        <UTextarea
          v-model="state.description"
          :rows="3"
          class="w-full"
        />
      </UFormField>

      <!-- Ausschreibungslink (nicht bei LADV — dort kommt er automatisch aus ladvData.url) -->
      <UFormField
        v-if="!isLadv"
        name="announcementLink"
        label="Ausschreibungslink"
      >
        <UInput
          v-model="state.announcementLink"
          type="url"
          placeholder="https://..."
          class="w-full"
        />
      </UFormField>

      <!-- Meldeschluss (Competition + LADV) -->
      <UFormField
        v-if="isCompetitionOrLadv"
        name="registrationDeadline"
        label="Meldeschluss"
      >
        <UInput
          v-model="state.registrationDeadline"
          type="date"
          class="w-full"
        />
        <LadvDiffHint
          v-if="ladvDiff.registrationDeadline"
          :value="ladvDiff.registrationDeadline"
          @apply="state.registrationDeadline = ladvDiff.registrationDeadline!"
        />
      </UFormField>

      <!-- Rennart (Competition + LADV) -->
      <UFormField
        v-if="isCompetitionOrLadv"
        name="raceType"
        label="Rennart"
      >
        <USelect
          v-model="state.raceType"
          :items="raceTypeItems"
          value-key="value"
          label-key="label"
          placeholder="Keine Angabe"
          class="w-full"
        />
        <LadvDiffHint
          v-if="ladvDiff.raceType"
          :value="ladvDiff.raceType === 'track' ? 'Bahn' : 'Straße'"
          @apply="state.raceType = ladvDiff.raceType"
        />
      </UFormField>

      <!-- Meisterschaft (nur LADV) -->
      <UFormField
        v-if="isLadv"
        name="championshipType"
        label="Meisterschaft"
      >
        <USelect
          v-model="state.championshipType"
          :items="championshipItems"
          value-key="value"
          label-key="label"
          placeholder="Keine Meisterschaft"
          class="w-full"
        />
      </UFormField>

      <div class="flex justify-end gap-3 pt-2">
        <UButton
          :to="`/events/${id}`"
          color="neutral"
          variant="ghost"
          label="Abbrechen"
        />
        <UButton
          type="submit"
          label="Speichern"
          :loading="loading"
        />
      </div>
    </UForm>
  </UContainer>
</template>
