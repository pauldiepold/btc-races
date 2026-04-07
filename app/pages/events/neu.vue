<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({ title: 'Event erstellen' })

const route = useRoute()
const toast = useToast()
const loading = ref(false)

const validTypes = ['competition', 'training', 'social'] as const
type EventType = typeof validTypes[number]
const queryType = route.query.type as string
const initialType: EventType = (validTypes as readonly string[]).includes(queryType) ? queryType as EventType : 'competition'

const schema = z.object({
  type: z.enum(['competition', 'training', 'social']),
  name: z.string().min(1, 'Name ist erforderlich'),
  date: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  registrationDeadline: z.string().optional(),
  announcementLink: z.union([z.literal(''), z.string().url('Bitte eine gültige URL eingeben')]).optional(),
  raceType: z.string().optional(),
  championshipType: z.string().optional(),
})

type Schema = z.output<typeof schema>

const state = reactive<Schema>({
  type: initialType,
  name: '',
  date: '',
  location: '',
  description: '',
  registrationDeadline: '',
  announcementLink: '',
  raceType: undefined,
  championshipType: undefined,
})

const isCompetition = computed(() => state.type === 'competition')

const typeItems = [
  { label: 'Wettkampf', value: 'competition' },
  { label: 'Training', value: 'training' },
  { label: 'Social', value: 'social' },
]

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

async function onSubmit(_event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    const { id } = await $fetch<{ id: string }>('/api/events', {
      method: 'POST',
      body: {
        type: state.type,
        name: state.name,
        date: state.date || undefined,
        location: state.location || undefined,
        description: state.description || undefined,
        registrationDeadline: isCompetition.value ? (state.registrationDeadline || undefined) : undefined,
        announcementLink: state.announcementLink || undefined,
        raceType: isCompetition.value ? (state.raceType || undefined) : undefined,
        championshipType: isCompetition.value ? (state.championshipType || undefined) : undefined,
      },
    })
    await navigateTo(`/events/${id}`)
  }
  catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Ein Fehler ist aufgetreten.'
    toast.add({ title: 'Fehler', description: msg, color: 'error' })
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
        Event erstellen
      </h1>
    </div>

    <UForm
      :schema="schema"
      :state="state"
      class="space-y-5"
      @submit="onSubmit"
    >
      <UFormField
        name="type"
        label="Typ"
        required
      >
        <USelect
          v-model="state.type"
          :items="typeItems"
          value-key="value"
          label-key="label"
          class="w-full"
        />
      </UFormField>

      <UFormField
        name="name"
        label="Name"
        required
      >
        <UInput
          v-model="state.name"
          placeholder="z.B. Berlin-Marathon"
          class="w-full"
        />
      </UFormField>

      <UFormField
        name="date"
        label="Datum"
      >
        <UInput
          v-model="state.date"
          type="date"
          class="w-full"
        />
      </UFormField>

      <UFormField
        name="location"
        label="Ort"
      >
        <UInput
          v-model="state.location"
          placeholder="z.B. Olympiastadion Berlin"
          class="w-full"
        />
      </UFormField>

      <UFormField
        name="description"
        label="Beschreibung"
      >
        <UTextarea
          v-model="state.description"
          placeholder="Kurze Beschreibung des Events..."
          :rows="3"
          class="w-full"
        />
      </UFormField>

      <UFormField
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

      <template v-if="isCompetition">
        <UFormField
          name="registrationDeadline"
          label="Meldeschluss"
        >
          <UInput
            v-model="state.registrationDeadline"
            type="date"
            class="w-full"
          />
        </UFormField>

        <UFormField
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
        </UFormField>

        <UFormField
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
      </template>

      <div class="flex justify-end gap-3 pt-2">
        <UButton
          to="/"
          color="neutral"
          variant="ghost"
          label="Abbrechen"
        />
        <UButton
          type="submit"
          label="Event erstellen"
          :loading="loading"
        />
      </div>
    </UForm>
  </UContainer>
</template>
