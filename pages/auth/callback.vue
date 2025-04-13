<script setup lang="ts">
const supabase = useSupabaseClient()

onMounted(async () => {
    const {
        data: { session },
        error,
    } = await supabase.auth.getSession()

    if (error) {
        console.error('Error getting session:', error)
        navigateTo('/login')
        return
    }

    if (session) {
        navigateTo('/admin')
    }
})
</script>

<template>
    <div class="flex min-h-screen items-center justify-center">
        <div class="text-center">
            <div
                class="border-primary mx-auto h-12 w-12 animate-spin rounded-full border-b-2"
            />
            <p class="mt-4 text-gray-600">Wird eingeloggt...</p>
        </div>
    </div>
</template>
