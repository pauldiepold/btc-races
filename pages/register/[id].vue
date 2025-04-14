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
  <NuxtLayout
    name="base"
    heading="Anmeldung: Berliner Triathlon Cup"
    back-link="/competitions/1"
    back-link-text="Zurück zum Wettkampf"
  >
    <BaseLayer class="max-w-2xl">
      <UForm :state="state" class="space-y-6" @submit="submitRegistration">
        <UFormField label="Name" name="member" size="lg" required>
          <USelect
            v-model="selectedMember"
            :options="[
              {
                label: 'Bitte wähle deinen Namen aus der Liste',
                value: '',
                disabled: true,
              },
              { label: 'Max Mustermann', value: '1' },
              { label: 'Maria Musterfrau', value: '2' },
              { label: 'Peter Schmidt', value: '3' },
              { label: 'Anna Müller', value: '4' },
            ]"
          />
          <template #help>
            Falls du deinen Namen nicht in der Liste findest, kontaktiere bitte
            den Vorstand.
          </template>
        </UFormField>

        <UFormField label="E-Mail-Adresse" name="email" size="lg">
          <UInput
            :model-value="memberEmail"
            disabled
            class="bg-(--ui-bg-elevated)"
          />
          <template #help>
            Die E-Mail-Adresse wird automatisch aus deinem Mitgliedsprofil
            übernommen.
          </template>
        </UFormField>

        <UFormField label="Anmerkungen (optional)" name="notes" size="lg">
          <UTextarea
            v-model="notes"
            placeholder="Hast du besondere Anmerkungen zur Anmeldung? (z.B. Startgruppe, Besonderheiten)"
            rows="4"
          />
        </UFormField>

        <UFormField name="terms" size="lg" required>
          <UCheckbox
            v-model="termsAccepted"
            label="Ich bestätige hiermit meine Teilnahme am Wettkampf"
          />
          <template #help>
            Nach Absenden des Formulars erhältst du eine Bestätigungsmail mit
            weiteren Informationen.
          </template>
        </UFormField>

        <div class="flex items-center justify-between">
          <p class="text-sm text-(--ui-text-dimmed)">* Pflichtfelder</p>
          <UButton
            type="submit"
            :disabled="!isFormValid"
            color="primary"
            size="lg"
          >
            Anmeldung absenden
          </UButton>
        </div>
      </UForm>
    </BaseLayer>
  </NuxtLayout>
</template>
