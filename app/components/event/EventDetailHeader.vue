<script setup lang="ts">
import type { EventDetail } from '~~/shared/types/events'
import { ladvDisciplineLabel } from '~~/shared/utils/ladv-labels'

const props = defineProps<{ event: EventDetail }>()

const eventDate = computed(() => toDate(props.event.date))
const day = computed(() =>
  eventDate.value?.toLocaleDateString('de-DE', { day: '2-digit' }) ?? null,
)
const month = computed(() =>
  eventDate.value?.toLocaleDateString('de-DE', { month: 'short' }).replace('.', '') ?? null,
)

const deadlineDate = computed(() => toDate(props.event.registrationDeadline))
const deadlineExpired = computed(() => !!deadlineDate.value && deadlineDate.value < new Date())
const showDeadline = computed(() =>
  (props.event.type === 'competition' || props.event.type === 'ladv') && !!deadlineDate.value,
)
const isCancelled = computed(() => !!props.event.cancelledAt)

// Ort: location + sportstaette zusammenführen
const locationDisplay = computed(() => {
  const parts: string[] = []
  if (props.event.location) parts.push(props.event.location)
  const s = props.event.ladvData?.sportstaette
  if (s && s !== props.event.location) parts.push(s)
  return parts.join(' · ')
})

const locationMapsUrl = computed(() => {
  const s = props.event.ladvData?.sportstaette
  if (!s || !props.event.location) return null
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s}, ${props.event.location}`)}`
})

// LADV Org-Infos
const veranstalter = computed(() => props.event.ladvData?.veranstalter ?? null)
const ausrichter = computed(() => {
  const a = props.event.ladvData?.ausrichter
  return a && a !== veranstalter.value ? a : null
})
const ladvBeschreibung = computed(() => props.event.ladvData?.beschreibung ?? null)
const attachements = computed(() => props.event.ladvData?.attachements ?? [])
const hasLadvSidebar = computed(() =>
  !!(veranstalter.value || ausrichter.value || ladvBeschreibung.value || disciplineGroups.value.length || attachements.value.length),
)

// Wettbewerbe (gruppiert nach Disziplin)
const disciplineGroups = computed(() => {
  const groups = new Map<string, string[]>()
  for (const w of props.event.ladvData?.wettbewerbe ?? []) {
    const key = w.disziplinNew
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(w.klasseNew)
  }
  return [...groups.entries()].map(([code, akCodes]) => ({
    code,
    label: ladvDisciplineLabel(code),
    akCodes,
  }))
})

// Modal
const modalOpen = ref(false)
const openDisciplines = ref<string[]>([])
function isOpen(code: string) {
  return openDisciplines.value.includes(code)
}
function toggle(code: string) {
  if (isOpen(code)) {
    openDisciplines.value = openDisciplines.value.filter(c => c !== code)
  }
  else {
    openDisciplines.value.push(code)
  }
}
</script>

<template>
  <div class="">
    <!-- Zwei Spalten auf Desktop, eine auf Mobile -->
    <div
      class="grid grid-cols-1 gap-6"
      :class="hasLadvSidebar ? 'lg:grid-cols-[1fr_auto]' : ''"
    >
      <!-- LINKE SPALTE: Kern-Infos -->
      <div class="flex items-start gap-4">
        <!-- Datum-Block -->
        <div
          v-if="eventDate"
          class="shrink-0 flex flex-col items-center w-10 pt-0.5 gap-0.5"
        >
          <span class="text-2xl font-bold text-highlighted tabular-nums leading-none">
            {{ day }}
          </span>
          <span class="text-xs text-primary uppercase tracking-wide">
            {{ month }}
          </span>
        </div>

        <!-- Trennlinie -->
        <div class="w-px self-stretch bg-border shrink-0 my-1" />

        <!-- Inhalt -->
        <div class="flex-1 min-w-0">
          <!-- Gruppe A: Typ + Badges -->
          <div class="flex items-center gap-2 flex-wrap mb-1.5">
            <span class="flex items-center gap-1.5 text-xs text-muted">
              <UIcon
                :name="eventTypeIcons[event.type]"
                class="size-3.5 shrink-0"
              />
              {{ eventTypeLabels[event.type] }}
            </span>
            <UBadge
              v-if="event.isWrc"
              icon="i-ph-trophy"
              label="WRC"
              color="primary"
              variant="subtle"
              size="xs"
            />
            <UBadge
              v-if="isCancelled"
              label="Abgesagt"
              color="error"
              variant="subtle"
              size="xs"
            />
            <UBadge
              v-if="event.championshipType && event.championshipType !== 'none'"
              :label="eventChampionshipLabels[event.championshipType]"
              color="neutral"
              variant="subtle"
              size="xs"
            />
          </div>

          <!-- Name -->
          <h1 class="font-display text-2xl font-bold tracking-tight text-highlighted">
            {{ event.name }}
          </h1>

          <!-- Meta-Zeile -->
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-base text-default mt-2">
            <a
              v-if="locationDisplay && locationMapsUrl"
              :href="locationMapsUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-1.5 text-primary transition-colors"
            >
              <UIcon
                name="i-ph-map-pin"
                class="size-4 shrink-0"
              />
              {{ locationDisplay }}
            </a>
            <span
              v-else-if="locationDisplay"
              class="flex items-center gap-1.5"
            >
              <UIcon
                name="i-ph-map-pin"
                class="size-4 text-muted shrink-0"
              />
              {{ locationDisplay }}
            </span>
            <span
              v-if="showDeadline"
              class="flex items-center gap-1.5"
              :class="deadlineExpired ? 'text-error' : ''"
            >
              <UIcon
                name="i-ph-clock"
                class="size-4 shrink-0"
                :class="deadlineExpired ? '' : 'text-muted'"
              />
              Meldeschluss {{ formatDate(deadlineDate) }}
              <span v-if="deadlineExpired">(abgelaufen)</span>
            </span>
            <span
              v-if="event.raceType"
              class="flex items-center gap-1.5"
            >
              <UIcon
                name="i-ph-flag"
                class="size-4 text-muted shrink-0"
              />
              {{ eventRaceTypeLabels[event.raceType] }}
            </span>
            <a
              v-if="event.ladvData?.url || event.announcementLink"
              :href="event.ladvData?.url ?? event.announcementLink ?? ''"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-1 text-primary hover:opacity-80 transition-opacity"
            >
              <UIcon
                name="i-ph-arrow-up-right-bold"
                class="size-3.5 shrink-0"
              />
              {{ event.ladvData?.url ? 'Zu LADV' : 'Ausschreibung' }}
            </a>
          </div>

          <!-- Beschreibung -->
          <p
            v-if="event.description"
            class="mt-3 text-base text-default leading-relaxed"
          >
            {{ event.description }}
          </p>

          <!-- LADV-Sidebar-Inhalt auf Mobile -->
          <div
            v-if="hasLadvSidebar"
            class="lg:hidden mt-5 space-y-4"
          >
            <!-- Org-Infos -->
            <div
              v-if="veranstalter || ausrichter"
              class="flex flex-wrap gap-x-6 gap-y-2"
            >
              <div v-if="veranstalter">
                <p class="text-xs text-muted mb-0.5">
                  Veranstalter
                </p>
                <p class="text-base text-highlighted">
                  {{ veranstalter }}
                </p>
              </div>
              <div v-if="ausrichter">
                <p class="text-xs text-muted mb-0.5">
                  Ausrichter
                </p>
                <p class="text-base text-highlighted">
                  {{ ausrichter }}
                </p>
              </div>
            </div>

            <!-- LADV-Beschreibung -->
            <div v-if="ladvBeschreibung">
              <p class="text-xs text-muted mb-0.5">
                LADV-Beschreibung
              </p>
              <p class="text-base text-default leading-relaxed">
                {{ ladvBeschreibung }}
              </p>
            </div>

            <!-- Wettbewerbe: kompakte Chips -->
            <div v-if="disciplineGroups.length">
              <p class="text-xs text-muted mb-2">
                Wettbewerbe
              </p>
              <div class="flex flex-wrap gap-1.5">
                <UBadge
                  v-for="group in disciplineGroups"
                  :key="group.code"
                  :label="group.label"
                  color="neutral"
                  variant="subtle"
                />
              </div>
              <UButton
                variant="ghost"
                color="neutral"
                size="xs"
                trailing-icon="i-ph-arrow-right"
                class="mt-2 -ml-1"
                @click="modalOpen = true"
              >
                Alle Wettbewerbe & Altersklassen
              </UButton>
            </div>

            <!-- Dokumente -->
            <div
              v-if="attachements.length"
              class="flex flex-col gap-1"
            >
              <a
                v-for="att in attachements"
                :key="att.url"
                :href="att.url"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-1.5 text-sm text-default hover:text-primary transition-colors"
              >
                <UIcon
                  :name="att.extension === '.pdf' ? 'i-ph-file-pdf' : 'i-ph-file'"
                  class="size-4 shrink-0 text-muted"
                />
                {{ att.name }}
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- RECHTE SPALTE: LADV-Details (nur Desktop) -->
      <div
        v-if="hasLadvSidebar"
        class="hidden lg:block lg:w-56 xl:w-64 shrink-0 space-y-4"
      >
        <!-- Org-Infos -->
        <div
          v-if="veranstalter || ausrichter"
          class="space-y-3"
        >
          <div v-if="veranstalter">
            <p class="text-xs text-muted mb-0.5">
              Veranstalter
            </p>
            <p class="text-base text-highlighted">
              {{ veranstalter }}
            </p>
          </div>
          <div v-if="ausrichter">
            <p class="text-xs text-muted mb-0.5">
              Ausrichter
            </p>
            <p class="text-base text-highlighted">
              {{ ausrichter }}
            </p>
          </div>
        </div>

        <!-- LADV-Beschreibung -->
        <div v-if="ladvBeschreibung">
          <p class="text-xs text-muted mb-0.5">
            LADV-Beschreibung
          </p>
          <p class="text-base text-default leading-relaxed">
            {{ ladvBeschreibung }}
          </p>
        </div>

        <!-- Wettbewerbe: kompakte Chips -->
        <div v-if="disciplineGroups.length">
          <p class="text-xs text-muted mb-2">
            Wettbewerbe
          </p>
          <div class="flex flex-wrap gap-1.5">
            <UBadge
              v-for="group in disciplineGroups"
              :key="group.code"
              :label="group.label"
              color="neutral"
              variant="subtle"
            />
          </div>
          <UButton
            variant="ghost"
            color="neutral"
            size="xs"
            trailing-icon="i-ph-arrow-right"
            class="mt-2 -ml-1"
            @click="modalOpen = true"
          >
            Alle Wettbewerbe & Altersklassen
          </UButton>
        </div>

        <!-- Dokumente -->
        <div
          v-if="attachements.length"
          class="flex flex-col gap-1"
        >
          <a
            v-for="att in attachements"
            :key="att.url"
            :href="att.url"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-1.5 text-sm text-default hover:text-primary transition-colors"
          >
            <UIcon
              :name="att.extension === '.pdf' ? 'i-ph-file-pdf' : 'i-ph-file'"
              class="size-4 shrink-0 text-muted"
            />
            {{ att.name }}
          </a>
        </div>
      </div>
    </div>

    <!-- Modal: vollständige Wettbewerb-Details -->
    <UModal
      v-model:open="modalOpen"
      title="Wettbewerbe"
    >
      <template #body>
        <div class="divide-y divide-default">
          <div
            v-for="group in disciplineGroups"
            :key="group.code"
          >
            <button
              type="button"
              :aria-expanded="isOpen(group.code)"
              class="w-full flex items-center justify-between gap-3 px-1 py-3 text-left hover:bg-elevated/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              @click="toggle(group.code)"
            >
              <span class="text-sm font-medium text-highlighted">{{ group.label }}</span>
              <div class="flex items-center gap-2 shrink-0">
                <span class="text-xs text-muted">{{ group.akCodes.length }} AK</span>
                <UIcon
                  name="i-ph-caret-down"
                  class="size-4 text-muted transition-transform duration-200 ease-out"
                  :class="isOpen(group.code) ? 'rotate-180' : ''"
                />
              </div>
            </button>
            <div
              class="grid transition-[grid-template-rows] duration-200 ease-out"
              :style="{ gridTemplateRows: isOpen(group.code) ? '1fr' : '0fr' }"
            >
              <div class="overflow-hidden">
                <div class="pb-3 flex flex-wrap gap-1.5">
                  <LadvBadge
                    v-for="ak in group.akCodes"
                    :key="ak"
                    :age-class="ak"
                    variant="subtle"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
