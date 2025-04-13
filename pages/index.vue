<script setup lang="ts">
import type { Database } from '~/types/database.types'

const client = useSupabaseClient<Database>()

const { data: competitions } = await useAsyncData('competitions', async () => {
    const { data } = await client
        .from('competitions')
        .select('id, name, date, location, registration_deadline')
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(3)

    return data
})
</script>

<template>
    <div class="">
        <div class="relative">
            <div class="relative container mx-auto px-4">
                <h2 class="mb-6 text-2xl font-bold">Aktuelle Wettkämpfe</h2>

                <div
                    class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
                >
                    <div
                        v-for="competition in competitions"
                        :key="competition.id"
                        class="transform overflow-hidden rounded-xl border bg-white shadow-lg transition-transform duration-300 hover:scale-105"
                    >
                        <div class="bg-black p-4 text-white">
                            <h3 class="text-xl font-bold">
                                {{ competition.name }}
                            </h3>
                            <p class="text-primary">
                                {{ formatDate(competition.date) }}
                            </p>
                        </div>
                        <div class="p-4">
                            <p class="mb-2">Ort: {{ competition.location }}</p>
                            <p class="mb-4">
                                Meldefrist:
                                {{
                                    formatDate(competition.registrationDeadline)
                                }}
                            </p>
                            <div class="flex space-x-2">
                                <NuxtLink
                                    :to="`/competitions/${competition.id}`"
                                    class="bg-primary hover:bg-primary rounded-lg px-4 py-2 text-black transition-colors duration-300"
                                >
                                    Details
                                </NuxtLink>
                                <NuxtLink
                                    :to="`/register/${competition.id}`"
                                    class="rounded-lg bg-black px-4 py-2 text-white transition-colors duration-300 hover:bg-gray-800"
                                >
                                    Anmelden
                                </NuxtLink>
                            </div>
                        </div>
                    </div>

                    <div
                        v-if="competitions.length === 0"
                        class="flex transform items-center justify-center overflow-hidden rounded-xl border bg-white p-8 shadow-lg transition-transform duration-300 hover:scale-105"
                    >
                        <p class="text-center text-gray-400">
                            Aktuell sind keine Wettkämpfe verfügbar
                        </p>
                    </div>
                </div>

                <div class="mt-12 mb-8">
                    <h2 class="mb-6 text-2xl font-bold">
                        Über das Anmeldesystem
                    </h2>
                    <div
                        class="transform rounded-xl bg-white p-6 shadow-lg transition-transform duration-300 hover:scale-105"
                    >
                        <p class="mb-4">
                            Das BTC-Wettkampfanmeldesystem ermöglicht
                            Vereinsmitgliedern eine einfache Anmeldung zu
                            aktuellen Wettkämpfen.
                        </p>
                        <p>
                            Um dich anzumelden, wähle einen Wettkampf aus der
                            Liste aus und klicke auf "Anmelden". Nach Auswahl
                            deines Namens aus der Mitgliederliste erhältst du
                            eine Bestätigungs-E-Mail.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
