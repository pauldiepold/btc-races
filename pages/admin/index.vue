<template>
  <NuxtLayout
    name="base"
    heading="Admin Dashboard"
    back-link="/"
    back-link-text="Zurück zur Startseite"
  >
    <template #actions>
      <UButton
        to="/admin/members/import"
        color="primary"
        class="w-full justify-center md:w-auto md:justify-start"
      >
        Mitglieder importieren
      </UButton>
    </template>

    <div class="space-y-8">
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <!-- Dashboard-Karten -->
        <UCard class="bg-(--ui-bg-elevated)">
          <template #header>
            <h2 class="text-xl font-bold">Wettkämpfe</h2>
          </template>
          <p class="text-3xl font-bold">5</p>
          <p class="mt-2 text-sm text-(--ui-text-dimmed)">Aktive Wettkämpfe</p>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-xl font-bold">Mitglieder</h2>
          </template>
          <p class="text-3xl font-bold">128</p>
          <p class="mt-2 text-sm text-(--ui-text-dimmed)">
            Registrierte Mitglieder
          </p>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-xl font-bold">Anmeldungen</h2>
          </template>
          <p class="text-3xl font-bold">42</p>
          <p class="mt-2 text-sm text-(--ui-text-dimmed)">
            Bestätigte Anmeldungen
          </p>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-xl font-bold">Ausstehend</h2>
          </template>
          <p class="text-3xl font-bold">8</p>
          <p class="mt-2 text-sm text-(--ui-text-dimmed)">
            Unbestätigte Anmeldungen
          </p>
        </UCard>
      </div>

      <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <!-- Aktuelle Wettkämpfe -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-bold">Aktuelle Wettkämpfe</h2>
              <UButton
                to="/admin/competitions"
                variant="ghost"
                color="primary"
                trailing-icon="lucide:arrow-right"
              >
                Alle anzeigen
              </UButton>
            </div>
          </template>

          <div class="space-y-4">
            <div class="border-b pb-4">
              <div class="flex justify-between">
                <h3 class="font-medium">Berliner Triathlon Cup</h3>
                <UBadge color="success" variant="soft">Aktiv</UBadge>
              </div>
              <p class="text-sm text-(--ui-text-dimmed)">15. Dezember 2024</p>
              <div class="mt-2 flex justify-between">
                <p class="text-sm">12 Anmeldungen</p>
                <UButton
                  to="/admin/competitions/1"
                  variant="ghost"
                  color="primary"
                  trailing-icon="lucide:arrow-right"
                >
                  Details
                </UButton>
              </div>
            </div>

            <div class="border-b pb-4">
              <div class="flex justify-between">
                <h3 class="font-medium">Hamburg Triathlon</h3>
                <UBadge color="success" variant="soft">Aktiv</UBadge>
              </div>
              <p class="text-sm text-(--ui-text-dimmed)">28. Januar 2025</p>
              <div class="mt-2 flex justify-between">
                <p class="text-sm">8 Anmeldungen</p>
                <UButton
                  to="/admin/competitions/2"
                  variant="ghost"
                  color="primary"
                  trailing-icon="lucide:arrow-right"
                >
                  Details
                </UButton>
              </div>
            </div>

            <div class="border-b pb-4">
              <div class="flex justify-between">
                <h3 class="font-medium">München Marathon</h3>
                <UBadge color="warning" variant="soft">Bald</UBadge>
              </div>
              <p class="text-sm text-(--ui-text-dimmed)">10. März 2025</p>
              <div class="mt-2 flex justify-between">
                <p class="text-sm">Noch keine Anmeldungen</p>
                <UButton
                  to="/admin/competitions/3"
                  variant="ghost"
                  color="primary"
                  trailing-icon="lucide:arrow-right"
                >
                  Details
                </UButton>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Neueste Anmeldungen -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-bold">Neueste Anmeldungen</h2>
              <UButton
                to="/admin/registrations"
                variant="ghost"
                color="primary"
                trailing-icon="lucide:arrow-right"
              >
                Alle anzeigen
              </UButton>
            </div>
          </template>

          <div class="space-y-4">
            <div class="border-b pb-4">
              <div class="flex justify-between">
                <h3 class="font-medium">Peter Schmidt</h3>
                <UBadge color="warning" variant="soft">Ausstehend</UBadge>
              </div>
              <p class="text-sm text-(--ui-text-dimmed)">
                Berliner Triathlon Cup
              </p>
              <div class="mt-2 flex justify-between">
                <p class="text-sm text-(--ui-text-dimmed)">Vor 2 Stunden</p>
                <div>
                  <UButton variant="ghost" color="success" class="mr-2">
                    Bestätigen
                  </UButton>
                  <UButton variant="ghost" color="error"> Ablehnen </UButton>
                </div>
              </div>
            </div>

            <div class="border-b pb-4">
              <div class="flex justify-between">
                <h3 class="font-medium">Maria Musterfrau</h3>
                <UBadge color="success" variant="soft">Bestätigt</UBadge>
              </div>
              <p class="text-sm text-(--ui-text-dimmed)">Hamburg Triathlon</p>
              <p class="mt-2 text-sm text-(--ui-text-dimmed)">Vor 5 Stunden</p>
            </div>

            <div class="border-b pb-4">
              <div class="flex justify-between">
                <h3 class="font-medium">Max Mustermann</h3>
                <UBadge color="success" variant="soft">Bestätigt</UBadge>
              </div>
              <p class="text-sm text-(--ui-text-dimmed)">
                Berliner Triathlon Cup
              </p>
              <p class="mt-2 text-sm text-(--ui-text-dimmed)">Vor 1 Tag</p>
            </div>

            <div class="border-b pb-4">
              <div class="flex justify-between">
                <h3 class="font-medium">Anna Müller</h3>
                <UBadge color="success" variant="soft">Bestätigt</UBadge>
              </div>
              <p class="text-sm text-(--ui-text-dimmed)">Hamburg Triathlon</p>
              <p class="mt-2 text-sm text-(--ui-text-dimmed)">Vor 2 Tagen</p>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </NuxtLayout>
</template>
