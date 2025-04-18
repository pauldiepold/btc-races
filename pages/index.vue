<script setup lang="ts">
import type { Database } from '~/types/database.types'
import type {
  RaceType,
  RegistrationType,
  ChampionshipType,
} from '~/types/enums'
import {
  raceTypeItems,
  registrationTypeItems,
  championshipTypeItems,
} from '~/types/enums'

definePageMeta({
  title: 'Startseite',
  colorMode: 'dark',
})

const client = useSupabaseClient<Database>()
const user = useSupabaseUser()

// Filter-Status
const searchString = ref('')
const selectedRegistrationType = ref<RegistrationType | undefined>(undefined)
const selectedRaceType = ref<RaceType | undefined>(undefined)
const selectedChampionshipType = ref<ChampionshipType | undefined>(undefined)

// Hilfsfunktionen für Datumsprüfung
const today = computed(() => {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
})

function isEventInPast(date: string) {
  if (!date) return false
  const eventDate = new Date(date)
  eventDate.setHours(0, 0, 0, 0)
  return eventDate < today.value
}

// Hilfsfunktion für Datumssortierung
const sortByDate = (a: any, b: any) =>
  new Date(a.date).getTime() - new Date(b.date).getTime()

// Status für die Anzahl der zusätzlich angezeigten Events
const additionalPastEvents = ref(0)
const additionalFutureEvents = ref(0)
const eventsPerLoad = 6

const {
  data: competitions,
  pending: loading,
  error,
} = await useAsyncData('competitions', async () => {
  const { data, error: supabaseError } = await client
    .from('competitions')
    .select()
    .order('date', { ascending: true })

  if (supabaseError) throw supabaseError

  return data
})

// Gefilterte Events
const filteredEvents = computed(() => {
  if (!competitions.value) return []

  return competitions.value.filter((event) => {
    // Textsuche
    if (searchString.value) {
      const suchbegriffe = searchString.value.toLowerCase().split(' ')
      const eventFelder = [event.name, event.description, event.location]
      const durchsuchbareFelder = eventFelder
        .filter((feld) => feld)
        .map((feld) => feld?.toLowerCase())

      const textMatch = suchbegriffe.every((begriff) => {
        return durchsuchbareFelder.some((feld) => feld?.includes(begriff))
      })
      if (!textMatch) return false
    }

    // Filter für registration_type
    if (
      selectedRegistrationType.value &&
      event.registration_type !== selectedRegistrationType.value
    ) {
      return false
    }

    // Filter für race_type
    if (selectedRaceType.value && event.race_type !== selectedRaceType.value) {
      return false
    }

    // Filter für championship_type
    if (
      selectedChampionshipType.value &&
      event.championship_type !== selectedChampionshipType.value
    ) {
      return false
    }

    return true
  })
})

// Aufgeteilte Events
const pastEvents = computed(() => {
  return filteredEvents.value
    .filter((event) => isEventInPast(event.date))
    .sort((a, b) => -sortByDate(a, b)) // Neueste vergangene zuerst
})

const futureEvents = computed(() => {
  return filteredEvents.value
    .filter((event) => !isEventInPast(event.date))
    .sort(sortByDate) // Nächste zuerst
})

// Sichtbare Events
const visibleEvents = computed(() => {
  // Wenn eine Suche aktiv ist, zeige alle gefundenen Events
  if (searchString.value) {
    return [...pastEvents.value, ...futureEvents.value].sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateA - dateB
    })
  }

  // Ansonsten zeige nur die angeforderte Anzahl
  const visiblePast = pastEvents.value.slice(0, additionalPastEvents.value)
  const visibleFuture = futureEvents.value.slice(
    0,
    eventsPerLoad + additionalFutureEvents.value
  )

  return [...visiblePast, ...visibleFuture].sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    return dateA - dateB
  })
})

// Prüfen, ob es mehr Events gibt
const hasMorePastEvents = computed(() => {
  // Keine "Mehr laden" Buttons während der Suche
  if (searchString.value) return false
  return additionalPastEvents.value < pastEvents.value.length
})

const hasMoreFutureEvents = computed(() => {
  // Keine "Mehr laden" Buttons während der Suche
  if (searchString.value) return false
  return (
    eventsPerLoad + additionalFutureEvents.value < futureEvents.value.length
  )
})

// Funktionen zum Laden weiterer Events
function loadMorePastEvents() {
  additionalPastEvents.value += eventsPerLoad
}

function loadMoreFutureEvents() {
  additionalFutureEvents.value += eventsPerLoad
}

// Reset der Anzahl angezeigter Events, wenn die Text-Suche beendet wird
watch(searchString, (newValue) => {
  if (!newValue) {
    additionalPastEvents.value = 0
    additionalFutureEvents.value = 0
  }
})

// Reset der Filter wenn ein Filter geändert wird
watch(
  [selectedRegistrationType, selectedRaceType, selectedChampionshipType],
  () => {
    additionalPastEvents.value = 0
    additionalFutureEvents.value = 0
  }
)
</script>

<template>
  <BasePage heading="Wettkämpfe">
    <template #actions>
      <ClientOnly>
        <UButton
          v-if="user"
          to="/admin/competitions/add"
          color="primary"
          class="w-full justify-center md:w-auto md:justify-start"
          icon="lucide:circle-plus"
        >
          Wettkampf hinzufügen
        </UButton>
      </ClientOnly>
    </template>

    <template #sidebar>
      <BaseLayer class="space-y-4">
        <h2 class="text-lg font-semibold">Über das Anmeldesystem</h2>
        <p>
          Mit diesem System kannst du dich für aktuelle Wettkämpfe anmelden, die
          per LADV durch unsere Coaches gemeldet werden müssen.
        </p>
        <hr />
        <p>So meldest du dich an:</p>
        <ul class="list-disc space-y-2 pl-4">
          <li>
            Wähle einen Wettkampf aus der Liste aus und klicke auf der
            Detailseite auf "Anmelden".
          </li>
          <li>
            Wähle im Formular deinen eigenen Namen aus und bestätige die
            Anmeldung.
          </li>
          <li>
            In der Bestätigungs-E-Mail findest du einen Link zur Anmeldung, über
            den du deine Teilnahme bestätigen musst.
          </li>
        </ul>
        <hr />
        <p>
          Kurz vor Ende der Meldefrist hast du noch einmal die Möglichkeit dich
          abzumelden. Ansonsten wirst du durch unsere Coaches bei dem Wettkampf
          angemeldet.
        </p>
      </BaseLayer>
    </template>

    <template #default>
      <div class="space-y-6">
        <!-- Suchfeld -->
        <UInput
          v-model="searchString"
          type="text"
          placeholder="Wettkampf suchen..."
          size="lg"
          color="neutral"
          icon="i-lucide-search"
          class="w-full"
        />

        <!-- Filter -->
        <div class="grid gap-4 md:grid-cols-3">
          <USelect
            v-model="selectedRegistrationType"
            :items="[
              { label: 'Alle', value: undefined },
              ...registrationTypeItems,
            ]"
            placeholder="Anmeldetyp"
            class="w-full"
          />
          <USelect
            v-model="selectedRaceType"
            :items="[{ label: 'Alle', value: undefined }, ...raceTypeItems]"
            placeholder="Rennart"
            class="w-full"
          />
          <USelect
            v-model="selectedChampionshipType"
            :items="[
              { label: 'Alle', value: undefined },
              ...championshipTypeItems,
            ]"
            placeholder="Meisterschaft"
            class="w-full"
          />
        </div>

        <!-- Lade-Status -->
        <div v-if="loading" class="py-8 text-center">
          <div
            class="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600"
          />
        </div>

        <!-- Fehlermeldung -->
        <div
          v-else-if="error"
          class="space-y-6 rounded border border-red-400 bg-red-100 px-4 text-red-700"
        >
          Ein Fehler ist aufgetreten beim Laden der Wettkämpfe.
        </div>

        <!-- Keine Ergebnisse -->
        <div
          v-else-if="visibleEvents.length === 0"
          class="text-center text-gray-500"
        >
          Keine Wettkämpfe gefunden
        </div>

        <div v-else>
          <!-- "Ältere anzeigen" Button -->
          <UButton
            v-if="hasMorePastEvents"
            class="mb-4 w-full cursor-pointer justify-center"
            variant="outline"
            color="neutral"
            size="sm"
            icon="lucide:chevrons-up"
            @click="loadMorePastEvents"
          >
            ältere Wettkämpfe anzeigen
          </UButton>

          <!-- Wettkampfliste -->
          <TransitionGroup name="list" tag="div" class="space-y-4">
            <div v-for="competition in visibleEvents" :key="competition.id">
              <CompetitionCard
                :competition="competition"
                class="block w-full transition-all duration-300"
              />
            </div>
          </TransitionGroup>
          <!-- "Weitere anzeigen" Button -->
          <UButton
            v-if="hasMoreFutureEvents"
            class="mt-4 w-full cursor-pointer justify-center"
            variant="outline"
            color="neutral"
            size="sm"
            icon="lucide:chevrons-down"
            @click="loadMoreFutureEvents"
          >
            weitere Wettkämpfe anzeigen
          </UButton>
        </div>
      </div>
    </template>
  </BasePage>
</template>

<style>
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(0px);
}

.list-leave-active {
  position: absolute;
}
</style>
