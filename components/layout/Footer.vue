<script setup lang="ts">
const { user } = useAuth()
</script>

<template>
    <footer class="bg-black py-8 text-white">
        <div class="container mx-auto px-4">
            <div class="flex flex-col items-center justify-center space-y-4">
                <div class="text-center">
                    <p>
                        © {{ new Date().getFullYear() }} - Berlin Track Club
                        e.V.
                    </p>
                </div>
                <a
                    href="https://berlin-track-club.de"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="hover:text-primary transition-colors"
                >
                    https://berlin-track-club.de
                </a>
                <NuxtLink
                    v-if="!user"
                    to="/admin"
                    class="bg-primary rounded-lg px-4 py-2 font-medium text-black transition-colors hover:bg-[#ffc940]"
                >
                    Admin-Bereich
                </NuxtLink>
            </div>
        </div>
    </footer>
</template>
