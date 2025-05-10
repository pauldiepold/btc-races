<script setup lang="ts">
import { useCompetitionRegistration } from '~/composables/useCompetitionRegistration'
import { useRepositories } from '~/composables/useRepositories'
import { useToastMessages } from '~/composables/useToastMessages'

definePageMeta({
  colorMode: 'dark',
})

const route = useRoute()
const user = useSupabaseUser()
const competitionId = route.params.id as string

const { competitions } = useRepositories()
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
        <CompetitionSyncButton :competition="competition" />
      </div>
    </template>
    <template #sidebar>
      <div class="space-y-6">
        <!-- Teilnehmer:innen Komponente -->
        <CompetitionParticipants :competition-id="competitionId" />

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
      <CompetitionDetails :competition="competition" />

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
