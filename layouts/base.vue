<script setup lang="ts">
withDefaults(
  defineProps<{
    heading?: string
    backLink?: string | null
    backLinkText?: string | null
  }>(),
  {
    heading: 'Berlin Track Club',
    backLink: null,
    backLinkText: null,
  }
)
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <LayoutNavbar />

    <main class="container mx-auto flex-grow px-4 py-6 md:py-8">
      <UButton
        v-if="backLink && backLinkText"
        :to="backLink"
        icon="lucide:arrow-left"
        variant="ghost"
        class="mb-4"
      >
        {{ backLinkText }}
      </UButton>
      <div class="mb-6 flex items-center justify-between">
        <h1 class="text-2xl font-bold">
          {{ heading }}
        </h1>
        <slot name="actions" />
      </div>

      <div class="flex flex-col gap-8 lg:flex-row">
        <!-- Hauptinhalt -->
        <div class="flex-1">
          <slot name="default" />

          <!-- Trennlinie für mobile Ansicht -->
          <hr
            v-if="$slots.sidebar"
            class="mt-8 border-(--ui-border-inverted) lg:hidden"
          />
        </div>

        <!-- Seitenleiste -->
        <div v-if="$slots.sidebar" class="lg:w-1/3">
          <slot name="sidebar" />
        </div>
      </div>
    </main>

    <LayoutFooter />
  </div>
</template>
