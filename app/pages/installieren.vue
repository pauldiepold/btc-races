<script setup lang="ts">
definePageMeta({
  title: 'App installieren',
  colorMode: 'dark',
})

useSeoMeta({
  title: 'App installieren',
  description: 'So installierst du die Berlin-Track-Club-App auf deinem Smartphone oder Desktop.',
})

const push = usePushNotifications()
const activeTab = ref<Platform>('ios')

onMounted(() => {
  push.init()
  activeTab.value = detectPlatform(navigator.userAgent, navigator.maxTouchPoints)
})

const tabs = [
  { label: 'iPhone / iPad', value: 'ios', icon: 'i-ph-apple-logo' },
  { label: 'Android', value: 'android', icon: 'i-ph-android-logo' },
  { label: 'Desktop', value: 'desktop', icon: 'i-ph-desktop' },
]

const iosSteps = [
  { icon: 'i-ph-compass', text: 'Öffne events.berlin-track-club.de in Safari.' },
  { icon: 'i-ph-share-fat', text: 'Tippe unten in der Leiste auf das Teilen-Symbol.' },
  { icon: 'i-ph-plus-square', text: 'Wähle „Zum Home-Bildschirm" aus der Liste.' },
  { icon: 'i-ph-check-circle', text: 'Tippe oben rechts auf „Hinzufügen".' },
  { icon: 'i-ph-house', text: 'Öffne die App über das neue Icon auf dem Home-Bildschirm.' },
]

const androidSteps = [
  { icon: 'i-ph-globe', text: 'Öffne events.berlin-track-club.de in Chrome.' },
  { icon: 'i-ph-dots-three-vertical', text: 'Tippe oben rechts auf das Menü (⋮).' },
  { icon: 'i-ph-download-simple', text: 'Wähle „App installieren" bzw. „Zum Startbildschirm hinzufügen".' },
  { icon: 'i-ph-house', text: 'Öffne die App über das neue Icon auf dem Startbildschirm.' },
]

const desktopSteps = [
  { icon: 'i-ph-globe', text: 'Öffne events.berlin-track-club.de in Chrome oder Edge.' },
  { icon: 'i-ph-download-simple', text: 'Klicke rechts in der Adressleiste auf das Installations-Symbol.' },
  { icon: 'i-ph-check-circle', text: 'Bestätige mit „Installieren".' },
]

const steps = computed(() => {
  if (activeTab.value === 'android') return androidSteps
  if (activeTab.value === 'desktop') return desktopSteps
  return iosSteps
})
</script>

<template>
  <UContainer class="py-10 lg:py-14 max-w-2xl">
    <div class="mb-8">
      <h1 class="font-display font-semibold text-highlighted text-2xl">
        App installieren
      </h1>
      <p class="text-muted mt-2">
        Installiere Berlin Track Club auf deinem Gerät — die App läuft dann im Vollbild,
        mit eigenem Icon. Auf dem iPhone ist das Voraussetzung für Push-Benachrichtigungen.
      </p>
    </div>

    <!-- Wird die Seite bereits aus der installierten App geöffnet -->
    <UAlert
      v-if="push.isInstalledPwa.value"
      class="mb-6"
      color="success"
      variant="subtle"
      icon="i-ph-check-circle-bold"
      title="App ist bereits installiert"
      description="Du nutzt Berlin Track Club gerade als installierte App — hier ist nichts weiter zu tun."
    />

    <UTabs
      v-model="activeTab"
      :items="tabs"
      :content="false"
      size="sm"
      color="neutral"
      class="w-full"
    />

    <div class="mt-6 space-y-5">
      <!-- iOS: Hinweis auf In-App-Browser -->
      <UAlert
        v-if="activeTab === 'ios'"
        color="warning"
        variant="subtle"
        icon="i-ph-warning-bold"
        title="Wichtig: in Safari öffnen"
        description="Öffne die Seite direkt in Safari — nicht im eingebauten Browser von WhatsApp, Instagram & Co. Tippe dort auf „•••“ oder das Teilen-Menü und wähle „In Safari öffnen“. Aus einem In-App-Browser entsteht sonst nur ein Lesezeichen statt der App."
      />

      <!-- Schritte (plattformabhängig) -->
      <ol class="space-y-3">
        <li
          v-for="(step, i) in steps"
          :key="i"
          class="flex items-start gap-3"
        >
          <span class="shrink-0 size-7 rounded-full bg-primary/15 text-primary text-sm font-semibold flex items-center justify-center">
            {{ i + 1 }}
          </span>
          <div class="flex items-center gap-2 pt-0.5">
            <UIcon
              :name="step.icon"
              class="size-5 text-muted shrink-0"
            />
            <span class="text-sm text-highlighted">{{ step.text }}</span>
          </div>
        </li>
      </ol>

      <!-- iOS: Erfolgskontrolle + Fehler melden -->
      <div
        v-if="activeTab === 'ios'"
        class="rounded-[--ui-radius] border border-default bg-muted p-4 space-y-2"
      >
        <p class="text-sm text-highlighted font-medium">
          Hat es geklappt?
        </p>
        <p class="text-sm text-muted">
          Wenn die App vom Home-Bildschirm im Vollbild <strong>ohne Safari-Adressleiste</strong>
          startet, ist sie richtig installiert. Öffnet sich stattdessen nur ein Lesezeichen
          <em>mit</em> Adressleiste, hat die Installation nicht funktioniert.
        </p>
        <p class="text-sm text-muted">
          Klappt es auch nach dem Weg über Safari nicht — meld dich kurz bei Paul,
          am besten mit iOS-Version und iPhone-Modell. Dann kann er dem Fehler nachgehen.
        </p>
      </div>
    </div>

    <!-- Abschluss: Push aktivieren -->
    <div class="mt-8 rounded-[--ui-radius] border border-yellow-500/30 bg-yellow-500/10 p-4">
      <div class="flex items-start gap-3">
        <UIcon
          name="i-ph-bell-ringing-bold"
          class="size-5 text-primary shrink-0 mt-0.5"
        />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-highlighted">
            Letzter Schritt: Push aktivieren
          </p>
          <p class="text-sm text-muted mt-0.5">
            Öffne die installierte App und aktiviere unter Profil → Benachrichtigungen
            die Erinnerungen vor Meldefristen.
          </p>
        </div>
      </div>
      <UButton
        to="/profil/benachrichtigungen"
        label="Benachrichtigungen"
        color="primary"
        variant="soft"
        size="sm"
        class="mt-3 ml-8"
      />
    </div>
  </UContainer>
</template>
