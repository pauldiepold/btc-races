<script setup lang="ts">
withDefaults(
  defineProps<{
    heading?: string
    backLink?: string | null
    backLinkText?: string | null
    maxWidth?: string | null
  }>(),
  {
    heading: 'Berlin Track Club',
    backLink: null,
    backLinkText: null,
    maxWidth: null,
  }
)
</script>

<template>
  <div :class="maxWidth ? `${maxWidth} mx-auto` : ''">
    <UButton
      v-if="backLink && backLinkText"
      :to="backLink"
      icon="i-lucide-arrow-left"
      variant="ghost"
      class="mb-4"
    >
      {{ backLinkText }}
    </UButton>
    <div
      v-if="heading"
      class="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-center"
    >
      <div class="flex items-center justify-start gap-4">
        <h1 class="text-2xl font-bold">
          {{ heading }}
        </h1>
        <div v-if="$slots.rightOfHeading">
          <slot name="rightOfHeading" />
        </div>
      </div>
      <div
        v-if="$slots.actions"
        class="flex flex-col justify-end gap-4 md:flex-row md:items-center"
      >
        <slot name="actions" />
      </div>
    </div>

    <div class="flex flex-col gap-6 lg:flex-row">
      <!-- Hauptinhalt -->
      <div class="flex-1">
        <slot name="default" />

        <!-- Trennlinie für mobile Ansicht -->
        <hr
          v-if="$slots.sidebar"
          class="mt-6 border-(--ui-border-inverted) lg:hidden"
        />
      </div>

      <!-- Seitenleiste -->
      <div v-if="$slots.sidebar" class="lg:w-1/3">
        <slot name="sidebar" />
      </div>
    </div>
  </div>
</template>
