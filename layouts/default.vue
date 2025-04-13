<template>
  <div class="flex min-h-screen flex-col">
    <LayoutNavbar />

    <main class="container mx-auto flex-grow px-4 py-6">
      <slot />
    </main>

    <LayoutFooter />
  </div>
</template>
