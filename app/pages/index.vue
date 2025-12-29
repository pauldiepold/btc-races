<script setup lang="ts">
definePageMeta({
  title: 'Startseite',
})
</script>

<template>
  <BasePage heading="Willkommen beim Berlin Track Club">
    <template #default>
      <div class="space-y-6">
        <AuthState v-slot="{ loggedIn, user }">
          <BaseLayer>
            <h2 class="text-xl font-semibold mb-4">
              Hallo{{ loggedIn && user ? `, ${user.firstName || user.email}` : '' }}!
            </h2>
            <p>
              Dies ist die Wettkampfanmeldung des Berlin Track Clubs.
            </p>
          </BaseLayer>
        </AuthState>
      </div>
    </template>
  </BasePage>
</template>
