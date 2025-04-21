<script setup lang="ts">
import {
  registrationTypeMapLong,
  raceTypeMap,
  championshipTypeMap,
} from '~/types/enums'
import { useCompetitionRegistration } from '~/composables/useCompetitionRegistration'
import { useRepositories } from '~/composables/useRepositories'
import { useToastMessages } from '~/composables/useToastMessages'

definePageMeta({
  colorMode: 'dark',
})

const route = useRoute()
const user = useSupabaseUser()
const competitionId = route.params.id as string

const { competitions, registrations } = useRepositories()
const { showError } = useToastMessages()

const { data: competition } = await useAsyncData(
  `competition-${competitionId}`,
  async () => {
    const result = await competitions.findById(competitionId)
    if (!result) {
      showError('Wettkampf konnte nicht geladen werden')
    }
    return result
  }
)

const { data: competitionRegistrations } = await useAsyncData(
  `registrations-${competitionId}`,
  async () => {
    const result = await registrations.findByCompetitionId(competitionId)
    if (!result || result.length === 0) {
      console.log('Keine Registrierungen gefunden oder Fehler beim Laden')
    }
    return result || []
  }
)

// Umleitung zur Übersichtsseite, wenn der Wettkampf nicht gefunden wurde
if (!competition.value) {
  navigateTo('/')
}

const canRegister = computed(() => {
  if (!competition.value) return false
  return useCompetitionRegistration(competition.value) === 'REGISTRATION_OPEN'
})
</script>

<template>
  <BasePage
    :heading="competition?.name"
    back-link="/"
    back-link-text="Zurück zur Übersicht"
  >
    <template #actions>
      <div class="flex flex-col gap-4 md:flex-row">
        <UButton
          v-if="competition && canRegister"
          :to="`/competitions/register/${competition.id}`"
          color="primary"
          size="lg"
          class="w-full justify-center md:w-auto md:justify-start"
        >
          Zu diesem Wettkampf anmelden
        </UButton>
        <UButton
          v-if="user && competition"
          :to="`/admin/competitions/${competition.id}/edit`"
          color="neutral"
          variant="outline"
          size="lg"
          class="w-full justify-center md:w-auto md:justify-start"
        >
          Wettkampf bearbeiten
        </UButton>
      </div>
    </template>
    <template #sidebar>
      <div class="space-y-6">
        <BaseLayer>
          <h2 class="mb-4 text-xl font-bold">Teilnehmer</h2>
          <p v-if="competitionRegistrations" class="text-sm">
            Bereits {{ competitionRegistrations.length }} Mitglieder angemeldet
          </p>

          <div class="mt-4 space-y-3">
            <div
              v-for="registration in competitionRegistrations"
              :key="registration.id"
              class="rounded bg-(--ui-bg) p-3"
            >
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="font-medium">{{ registration.member.name }}</p>
                  <p
                    class="text-sm"
                    :class="{
                      'text-green-600': registration.status === 'confirmed',
                      'text-yellow-600': registration.status === 'pending',
                      'text-red-600': registration.status === 'canceled',
                    }"
                  >
                    {{
                      registration.status === 'confirmed'
                        ? 'Bestätigt'
                        : registration.status === 'pending'
                          ? 'Ausstehend'
                          : 'Abgesagt'
                    }}
                  </p>
                </div>
                <!-- TODO: Button um neue E-Mail anzufordern -->
                <div class="text-right">
                  <div
                    class="flex items-center justify-end gap-2 text-sm text-gray-500"
                  >
                    <span>{{
                      new Date(registration.created_at).toLocaleDateString(
                        'de-DE'
                      )
                    }}</span>
                    <UIcon name="lucide:calendar" class="h-4 w-4" />
                  </div>
                </div>
              </div>
              <p v-if="registration.notes" class="mt-2 text-sm text-gray-600">
                {{ registration.notes }}
              </p>
            </div>
          </div>
        </BaseLayer>

        <!-- Kontakt -->
        <BaseLayer>
          <h2 class="mb-4 text-xl font-bold">Fragen?</h2>
          <p class="mb-4">
            Bei Fragen zum Wettkampf kontaktiere bitte unsere Coaches über Final
            Surge.
          </p>
          <UButton
            to="https://www.finalsurge.com/"
            color="neutral"
            variant="outline"
            target="_blank"
            trailing-icon="lucide:external-link"
          >
            Final Surge öffnen
          </UButton>
        </BaseLayer>
      </div>
    </template>

    <div v-if="competition" class="space-y-6">
      <!-- Wettkampfdetails -->
      <BaseLayer>
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <UFormField label="Status" size="lg">
            <CompetitionStatus class="mt-2" :competition="competition" />
          </UFormField>

          <UFormField label="Ort" size="lg">
            <UInput
              :model-value="competition.location"
              icon="lucide:map-pin"
              class="w-full !cursor-pointer"
              disabled
            />
          </UFormField>

          <UFormField
            label="Meldefrist"
            size="lg"
            class="w-full !cursor-pointer"
          >
            <UInput
              :model-value="
                new Date(competition.registration_deadline).toLocaleDateString(
                  'de-DE'
                )
              "
              icon="lucide:clock"
              class="w-full !cursor-pointer"
              disabled
            />
          </UFormField>

          <UFormField label="Datum" size="lg">
            <UInput
              :model-value="
                new Date(competition.date).toLocaleDateString('de-DE')
              "
              icon="lucide:calendar"
              class="w-full !cursor-pointer"
              disabled
            />
          </UFormField>

          <UFormField label="Anmeldung" size="lg">
            <UInput
              :model-value="
                registrationTypeMapLong[competition.registration_type]
              "
              icon="lucide:tag"
              class="w-full !cursor-pointer"
              disabled
            />
          </UFormField>

          <UFormField label="Rennart" size="lg">
            <UInput
              :model-value="raceTypeMap[competition.race_type]"
              icon="lucide:ruler"
              class="w-full !cursor-pointer"
              disabled
            />
          </UFormField>

          <UFormField label="Meisterschaft" size="lg">
            <UInput
              :model-value="championshipTypeMap[competition.championship_type]"
              icon="lucide:clock"
              class="w-full !cursor-pointer"
              disabled
            />
          </UFormField>
        </div>
      </BaseLayer>

      <!-- Beschreibung -->
      <BaseLayer>
        <h2 class="mb-4 text-xl font-bold">Beschreibung</h2>
        <div
          v-if="competition.description"
          class="prose max-w-none"
          v-html="competition.description"
        />
        <div v-else>Keine Beschreibung verfügbar.</div>
      </BaseLayer>

      <!-- Ausschreibung -->
      <BaseLayer v-if="competition.announcement_link">
        <h2 class="mb-4 text-xl font-bold">Ausschreibung</h2>
        <p class="mb-4">
          Weitere Details findest du in der offiziellen Ausschreibung:
        </p>
        <UButton
          :to="competition.announcement_link"
          target="_blank"
          color="neutral"
          variant="soft"
          trailing-icon="lucide:external-link"
        >
          Ausschreibung öffnen
        </UButton>
      </BaseLayer>
    </div>
  </BasePage>
</template>
