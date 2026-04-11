<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { Time } from '@internationalized/date'

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
  startTime: z.union([z.literal(''), z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:MM')]).optional(),
  durationHours: z.number().int().min(0).optional(),
  durationMinutes: z.number().int().min(0).max(55).optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  registrationDeadline: z.string().optional(),
  announcementLink: z.union([z.literal(''), z.string().url('Bitte eine gültige URL eingeben')]).optional(),
  raceType: z.string().optional(),
  championshipType: z.string().optional(),
  priority: z.enum(['A', 'B', 'C']).optional(),
})

type Schema = z.output<typeof schema>

const state = reactive<Schema>({
  type: initialType,
  name: '',
  date: '',
  startTime: '',
  durationHours: undefined,
  durationMinutes: undefined,
  location: '',
  description: '',
  registrationDeadline: '',
  announcementLink: '',
  raceType: undefined,
  championshipType: undefined,
  priority: undefined,
})

const isCompetition = computed(() => state.type === 'competition')

const startTimeModel = computed({
  get: (): Time | null => {
    if (!state.startTime) return null
    const [h, m] = state.startTime.split(':').map(Number)
    return new Time(h, m)
  },
  set: (val: Time | null) => {
    state.startTime = val
      ? `${String(val.hour).padStart(2, '0')}:${String(val.minute).padStart(2, '0')}`
      : ''
  },
})

const { session } = useUserSession()
const isAdmin = computed(() => session.value?.user?.role === 'admin' || session.value?.user?.role === 'superuser')

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

const priorityItems = [
  { label: 'Keine Priorität', value: undefined },
  { label: 'A-Rennen', value: 'A' },
  { label: 'B-Rennen', value: 'B' },
  { label: 'C-Rennen', value: 'C' },
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
        startTime: state.startTime || undefined,
        duration: ((state.durationHours ?? 0) * 60 + (state.durationMinutes ?? 0)) || undefined,
        location: state.location || undefined,
        description: state.description || undefined,
        registrationDeadline: isCompetition.value ? (state.registrationDeadline || undefined) : undefined,
        announcementLink: state.announcementLink || undefined,
        raceType: isCompetition.value ? (state.raceType || undefined) : undefined,
        championshipType: isCompetition.value ? (state.championshipType || undefined) : undefined,
        priority: isCompetition.value ? (state.priority || undefined) : undefined,
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

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <UFormField
          name="startTime"
          label="Startzeit"
        >
          <UInputTime
            v-model="startTimeModel"
            :hour-cycle="24"
            :step="{ minute: 5 }"
            :step-snapping="true"
            class="w-full"
          />
        </UFormField>

        <UFormField
          name="durationHours"
          label="Dauer"
          class="sm:col-span-2"
        >
          <div class="flex items-center gap-2">
            <UInputNumber
              v-model="state.durationHours"
              :min="0"
              placeholder="0"
              class="flex-1 min-w-0"
            />
            <span class="text-sm text-muted shrink-0">h</span>
            <UInputNumber
              v-model="state.durationMinutes"
              :min="0"
              :max="55"
              :step="5"
              placeholder="0"
              class="flex-1 min-w-0"
            />
            <span class="text-sm text-muted shrink-0">min</span>
          </div>
        </UFormField>
      </div>

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

        <UFormField
          v-if="isAdmin"
          name="priority"
          label="Priorität"
        >
          <USelect
            v-model="state.priority"
            :items="priorityItems"
            value-key="value"
            label-key="label"
            placeholder="Keine Priorität"
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
