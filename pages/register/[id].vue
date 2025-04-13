<script setup>
import { computed, ref } from 'vue'

// Die Wettkampf-ID aus der Route
const route = useRoute()
const competitionId = route.params.id

// Form state
const selectedMember = ref('')
const notes = ref('')
const termsAccepted = ref(false)

// Simulierte E-Mail-Adresse, später aus Datenbank
const memberEmail = computed(() => {
  if (!selectedMember.value) return '-'

  // Simulierte E-Mail-Adressen, später werden diese aus der Datenbank geladen
  const emailMap = {
    1: 'max.mustermann@example.com',
    2: 'maria.musterfrau@example.com',
    3: 'peter.schmidt@example.com',
    4: 'anna.mueller@example.com',
  }

  return emailMap[selectedMember.value] || '-'
})

// Formular-Validierung
const isFormValid = computed(() => {
  return selectedMember.value && termsAccepted.value
})

// Anmeldung absenden
async function submitRegistration() {
  try {
    // Simuliere API-Aufruf
    console.log('Anmeldedaten:', {
      competitionId,
      memberId: selectedMember.value,
      email: memberEmail.value,
      notes: notes.value,
    })

    // Hier später: Tatsächlicher API-Aufruf an Supabase
    // await $fetch('/api/registrations', {
    //   method: 'POST',
    //   body: {
    //     competitionId,
    //     memberId: selectedMember.value,
    //     notes: notes.value
    //   }
    // })

    // Später: Weiterleitung zur Bestätigungsseite
    alert(
      'Deine Anmeldung wurde erfolgreich gesendet! Du erhältst in Kürze eine Bestätigungs-E-Mail.'
    )
  } catch (error) {
    console.error('Fehler bei der Anmeldung:', error)
    alert(
      'Bei der Anmeldung ist ein Fehler aufgetreten. Bitte versuche es später noch einmal.'
    )
  }
}
</script>

<template>
  <div>
    <div class="mb-8 bg-gray-100 py-8">
      <div class="container mx-auto px-4">
        <NuxtLink
          to="/competitions/1"
          class="text-primary mb-2 inline-block hover:underline"
        >
          &larr; Zurück zum Wettkampf
        </NuxtLink>
        <h1 class="text-3xl font-bold">Anmeldung: Berliner Triathlon Cup</h1>
        <p class="text-gray-600">15. Dezember 2024 • Berlin, Wannsee</p>
      </div>
    </div>

    <div class="container mx-auto mb-12 max-w-3xl px-4">
      <div class="rounded-lg bg-white p-6 shadow-md">
        <h2 class="mb-6 text-xl font-bold">Persönliche Daten</h2>

        <form @submit.prevent="submitRegistration">
          <div class="mb-6">
            <label class="mb-2 block text-sm font-medium text-gray-700">
              Name *
            </label>
            <select
              v-model="selectedMember"
              class="w-full rounded-md border border-gray-300 p-2"
              required
            >
              <option value="" disabled>
                Bitte wähle deinen Namen aus der Liste
              </option>
              <option value="1">Max Mustermann</option>
              <option value="2">Maria Musterfrau</option>
              <option value="3">Peter Schmidt</option>
              <option value="4">Anna Müller</option>
              <!-- Wird später dynamisch aus Mitgliederliste gefüllt -->
            </select>
            <p class="mt-1 text-sm text-gray-500">
              Falls du deinen Namen nicht in der Liste findest, kontaktiere
              bitte den Vorstand.
            </p>
          </div>

          <div class="mb-6">
            <label class="mb-2 block text-sm font-medium text-gray-700">
              E-Mail-Adresse
            </label>
            <p class="rounded-md bg-gray-100 p-2">
              {{ memberEmail }}
            </p>
            <p class="mt-1 text-sm text-gray-500">
              Die E-Mail-Adresse wird automatisch aus deinem Mitgliedsprofil
              übernommen.
            </p>
          </div>

          <div class="mb-8">
            <label class="mb-2 block text-sm font-medium text-gray-700">
              Anmerkungen (optional)
            </label>
            <textarea
              v-model="notes"
              class="w-full rounded-md border border-gray-300 p-2"
              rows="4"
              placeholder="Hast du besondere Anmerkungen zur Anmeldung? (z.B. Startgruppe, Besonderheiten)"
            />
          </div>

          <div class="mb-8">
            <div class="flex items-start">
              <div class="flex h-5 items-center">
                <input
                  id="terms"
                  v-model="termsAccepted"
                  type="checkbox"
                  class="text-primary focus:ring-primary h-4 w-4 rounded border-gray-300"
                  required
                />
              </div>
              <div class="ml-3 text-sm">
                <label for="terms" class="font-medium text-gray-700">
                  Ich bestätige hiermit meine Teilnahme am Wettkampf *
                </label>
                <p class="text-gray-500">
                  Nach Absenden des Formulars erhältst du eine Bestätigungsmail
                  mit weiteren Informationen.
                </p>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <p class="text-sm text-gray-500">* Pflichtfelder</p>
            <BaseButton type="submit" :disabled="!isFormValid">
              Anmeldung absenden
            </BaseButton>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
