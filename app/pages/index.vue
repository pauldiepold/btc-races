<script setup lang="ts">
definePageMeta({ title: 'Startseite' })

const steps = [
  {
    number: '01',
    title: 'Event auswählen',
    description: 'Stöbere durch die anstehenden Wettkämpfe und such dir deinen nächsten Start.',
  },
  {
    number: '02',
    title: 'Anmelden',
    description: 'Deine Anmeldung zu meldepflichtigen Wettkämpfen landet direkt bei den Coaches.',
  },
  {
    number: '03',
    title: 'Starten',
    description: 'Die Coaches kümmern sich um die LADV-Einschreibung und informieren dich per E-Mail.',
  },
]

const skeletonNameWidths = ['w-56', 'w-44', 'w-64', 'w-48', 'w-52']
const skeletonLocWidths = ['w-32', 'w-40', 'w-28', 'w-36', 'w-44']
</script>

<template>
  <UContainer class="py-10 lg:py-14">
    <div class="flex flex-col gap-14 lg:flex-row lg:gap-16 lg:items-start">
      <!-- ── Events (Hauptinhalt) ──────────────────────────────────── -->
      <div class="flex-1 min-w-0">
        <!-- Abschnittsheader -->
        <div class="flex items-end justify-between mb-8 pb-5 border-b border-default">
          <div>
            <p class="text-xs font-medium text-muted uppercase tracking-widest mb-2">
              Berlin Track Club
            </p>
            <h1 class="text-3xl font-bold tracking-tight text-highlighted">
              Kommende Events
            </h1>
          </div>

          <!-- Filter-Placeholder (kommt später) -->
          <div class="hidden sm:flex items-center gap-1 p-1 rounded-[--ui-radius] bg-elevated">
            <USkeleton class="h-6 w-10 rounded-[--ui-radius]" />
            <USkeleton class="h-6 w-12 rounded-[--ui-radius]" />
            <USkeleton class="h-6 w-14 rounded-[--ui-radius]" />
            <USkeleton class="h-6 w-10 rounded-[--ui-radius]" />
          </div>
        </div>

        <!-- Event-Skeleton-Karten -->
        <div class="space-y-2">
          <div
            v-for="i in 5"
            :key="i"
            class="group flex items-center gap-4 px-4 py-4 rounded-[--ui-radius] border border-default bg-muted hover:bg-accented hover:border-accented transition-all duration-150"
          >
            <!-- Datum-Block -->
            <div class="shrink-0 flex flex-col items-center w-10 gap-1">
              <USkeleton class="h-5 w-7" />
              <USkeleton class="h-3 w-8" />
            </div>

            <!-- Trennlinie -->
            <div class="w-px h-9 bg-border shrink-0" />

            <!-- Event-Infos -->
            <div class="flex-1 min-w-0 space-y-2">
              <USkeleton :class="['h-4', skeletonNameWidths[(i - 1) % skeletonNameWidths.length]]" />
              <USkeleton :class="['h-3', skeletonLocWidths[(i - 1) % skeletonLocWidths.length]]" />
            </div>

            <!-- Badge + Button -->
            <div class="shrink-0 hidden sm:flex items-center gap-3">
              <USkeleton class="h-5 w-16 rounded-full" />
              <USkeleton class="h-8 w-24 rounded-[--ui-radius]" />
            </div>
          </div>
        </div>
      </div>

      <!-- ── Sidebar: Erklärung ────────────────────────────────────── -->
      <aside class="lg:w-64 xl:w-72 lg:shrink-0 lg:sticky lg:top-[calc(var(--ui-header-height)+2rem)]">
        <div class="pb-5 mb-6 border-b border-default">
          <p class="text-xs font-medium text-muted uppercase tracking-widest mb-2">
            So funktioniert's
          </p>
          <h2 class="font-display font-semibold text-xl text-highlighted">
            In drei Schritten zum Start
          </h2>
        </div>

        <ol class="space-y-7">
          <li
            v-for="step in steps"
            :key="step.number"
            class="flex gap-4"
          >
            <span class="font-display font-bold text-2xl text-primary leading-none shrink-0 tabular-nums w-8">
              {{ step.number }}
            </span>
            <div>
              <p class="font-semibold text-sm text-highlighted mb-1">
                {{ step.title }}
              </p>
              <p class="text-sm text-muted leading-relaxed">
                {{ step.description }}
              </p>
            </div>
          </li>
        </ol>

        <div class="mt-8 pt-6 border-t border-default space-y-3">
          <p class="text-sm text-muted">
            Fragen oder Probleme?
          </p>
          <UButton
            to="https://app.campai.com/pt/9a0cd/rooms/room/688357998a5abe1409d4fc8e/channel"
            target="_blank"
            rel="noopener noreferrer"
            color="neutral"
            variant="outline"
            size="sm"
            trailing-icon="i-ph-arrow-up-right-bold"
            block
          >
            BTC Community
          </UButton>
        </div>
      </aside>
    </div>
  </UContainer>
</template>
