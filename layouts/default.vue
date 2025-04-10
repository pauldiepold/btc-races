<template>
  <div class="min-h-screen flex flex-col">
    <LayoutTopNavigation />

    <main class="flex-grow container mx-auto px-4 py-6">
      <slot />
    </main>

    <LayoutFooter />
  </div>
</template>
