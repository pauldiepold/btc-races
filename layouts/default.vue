<template>
  <div class="flex min-h-screen flex-col">
    <LayoutNavbar />

    <main class="container mx-auto flex-grow px-4 py-6 md:px-6 md:py-8">
      <slot />
    </main>

    <LayoutFooter />
  </div>
</template>
