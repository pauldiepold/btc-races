<script setup lang="ts">
const { loggedIn, user } = useUserSession()

definePageMeta({
  title: 'Startseite',
})
</script>

<template>
  <BasePage heading="Willkommen beim Berlin Track Club">
    <template #default>
      <div class="space-y-6">
        <BaseLayer>
          <h2 class="text-xl font-semibold mb-4">
            Hallo{{ loggedIn && user ? `, ${user.name || user.email}` : '' }}!
          </h2>
          <p>
            Dies ist die Wettkampfanmeldung des Berlin Track Clubs.
          </p>
        </BaseLayer>
      </div>
    </template>
  </BasePage>
</template>
