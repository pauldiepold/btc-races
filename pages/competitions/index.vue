<script setup lang="ts">
import type { Database } from '~/types/database.types'
import { useSupabaseClient } from '#imports'

// Filter-Status
const searchQuery = ref('')

// Hilfsfunktionen für Datumsprüfung
const today = computed(() => {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
})

function isEventInPast(date: string) {
  if (!date)
    return false
  const eventDate = new Date(date)
  eventDate.setHours(0, 0, 0, 0)
  return eventDate < today.value
}

// Hilfsfunktion für Datumssortierung
const sortByDate = (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()

// Status für die Anzahl der zusätzlich angezeigten Events
const additionalPastEvents = ref(0)
const additionalFutureEvents = ref(0)
const eventsPerLoad = 2

// Serverseitiges Laden der Daten
const { data: competitions, pending: loading, error } = await useAsyncData(
  'competitions',
  async () => {
    const supabase = useSupabaseClient<Database>()
    const { data, error: supabaseError } = await supabase
      .from('competitions')
      .select('*')
      .order('date', { ascending: true })

    if (supabaseError)
      throw supabaseError

    return data
  },
)

// Gefilterte Events
const filteredEvents = computed(() => {
  if (!competitions.value)
    return []

  return competitions.value.filter((event) => {
    if (searchQuery.value) {
      const searchTerms = searchQuery.value.toLowerCase().split(' ')
      const searchableFields = [
        event.name,
        event.description,
        event.location,
      ].filter(Boolean).map(field => field?.toLowerCase())

      return searchTerms.every(term =>
        searchableFields.some(field => field?.includes(term)),
      )
    }
    return true
  })
})

// Aufgeteilte Events
const pastEvents = computed(() => {
  return filteredEvents.value
    .filter(event => isEventInPast(event.date))
    .sort((a, b) => -sortByDate(a, b)) // Neueste vergangene zuerst
})

const futureEvents = computed(() => {
  return filteredEvents.value
    .filter(event => !isEventInPast(event.date))
    .sort(sortByDate) // Nächste zuerst
})

// Sichtbare Events
const visibleEvents = computed(() => {
  // Wenn eine Suche aktiv ist, zeige alle gefundenen Events
  if (searchQuery.value) {
    return [...pastEvents.value, ...futureEvents.value].sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateA - dateB
    })
  }

  // Ansonsten zeige nur die angeforderte Anzahl
  const visiblePast = pastEvents.value.slice(0, additionalPastEvents.value)
  const visibleFuture = futureEvents.value.slice(0, eventsPerLoad + additionalFutureEvents.value)

  return [...visiblePast, ...visibleFuture].sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    return dateA - dateB
  })
})

// Prüfen, ob es mehr Events gibt
const hasMorePastEvents = computed(() => {
  // Keine "Mehr laden" Buttons während der Suche
  if (searchQuery.value)
    return false
  return additionalPastEvents.value < pastEvents.value.length
})

const hasMoreFutureEvents = computed(() => {
  // Keine "Mehr laden" Buttons während der Suche
  if (searchQuery.value)
    return false
  return eventsPerLoad + additionalFutureEvents.value < futureEvents.value.length
})

// Funktionen zum Laden weiterer Events
function loadMorePastEvents() {
  additionalPastEvents.value += eventsPerLoad
}

function loadMoreFutureEvents() {
  additionalFutureEvents.value += eventsPerLoad
}

// Reset der Anzahl angezeigter Events wenn die Suche beendet wird
watch(searchQuery, (newValue) => {
  if (!newValue) {
    additionalPastEvents.value = 0
    additionalFutureEvents.value = 0
  }
})
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-2xl font-bold">
        Veranstaltungen
      </h1>
      <NuxtLink
        to="/admin/competitions/new"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Neue Veranstaltung
      </NuxtLink>
    </div>

    <!-- Suchfeld -->
    <div class="mb-8">
      <div class="relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Veranstaltung suchen..."
          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
      </div>
    </div>

    <!-- Lade-Status -->
    <div v-if="loading" class="text-center py-8">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
    </div>

    <!-- Fehlermeldung -->
    <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
      Ein Fehler ist aufgetreten beim Laden der Veranstaltungen.
    </div>

    <!-- Keine Ergebnisse -->
    <div v-else-if="visibleEvents.length === 0" class="text-center py-8 text-gray-500">
      Keine Veranstaltungen gefunden
    </div>

    <template v-else>
      <!-- "Ältere anzeigen" Button -->
      <div v-if="hasMorePastEvents" class="mb-6">
        <button
          class="w-full py-2 border border-gray-200 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
          @click="loadMorePastEvents"
        >
          Ältere Veranstaltungen anzeigen
        </button>
      </div>

      <!-- Veranstaltungsliste -->
      <TransitionGroup
        name="list"
        tag="div"
        class="space-y-4"
      >
        <div
          v-for="competition in visibleEvents"
          :key="competition.id"
          class="relative"
        >
          <!-- Past Event Marker -->
          <div
            v-if="isEventInPast(competition.date)"
            class="absolute -left-2 top-0 bottom-0 w-1 bg-yellow-200 rounded-full"
          />
          <CompetitionCard
            :competition="competition"
            class="block w-full transition-all duration-300"
            :class="{ 'pl-2': isEventInPast(competition.date) }"
          />
        </div>
      </TransitionGroup>

      <!-- "Weitere anzeigen" Button -->
      <div v-if="hasMoreFutureEvents" class="mt-6">
        <button
          class="w-full py-2 border border-gray-200 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
          @click="loadMoreFutureEvents"
        >
          Weitere Veranstaltungen anzeigen
        </button>
      </div>
    </template>
  </div>
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
