<template>
    <div>
        <div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <!-- Dashboard-Karten -->
            <div
                class="border-primary rounded-lg border-l-4 bg-white p-6 shadow-md"
            >
                <h2 class="mb-2 text-xl font-bold">Wettkämpfe</h2>
                <p class="text-3xl font-bold">5</p>
                <p class="mt-2 text-sm text-gray-500">Aktive Wettkämpfe</p>
            </div>

            <div
                class="border-primary rounded-lg border-l-4 bg-white p-6 shadow-md"
            >
                <h2 class="mb-2 text-xl font-bold">Mitglieder</h2>
                <p class="text-3xl font-bold">128</p>
                <p class="mt-2 text-sm text-gray-500">
                    Registrierte Mitglieder
                </p>
            </div>

            <div
                class="border-primary rounded-lg border-l-4 bg-white p-6 shadow-md"
            >
                <h2 class="mb-2 text-xl font-bold">Anmeldungen</h2>
                <p class="text-3xl font-bold">42</p>
                <p class="mt-2 text-sm text-gray-500">Bestätigte Anmeldungen</p>
            </div>

            <div
                class="border-primary rounded-lg border-l-4 bg-white p-6 shadow-md"
            >
                <h2 class="mb-2 text-xl font-bold">Ausstehend</h2>
                <p class="text-3xl font-bold">8</p>
                <p class="mt-2 text-sm text-gray-500">
                    Unbestätigte Anmeldungen
                </p>
            </div>
        </div>

        <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <!-- Aktuelle Wettkämpfe -->
            <div class="rounded-lg bg-white p-6 shadow-md">
                <div class="mb-6 flex items-center justify-between">
                    <h2 class="text-xl font-bold">Aktuelle Wettkämpfe</h2>
                    <BaseLink to="/admin/competitions">
                        Alle anzeigen
                    </BaseLink>
                </div>

                <div class="space-y-4">
                    <div class="border-b pb-4">
                        <div class="flex justify-between">
                            <h3 class="font-medium">Berliner Triathlon Cup</h3>
                            <span
                                class="rounded bg-green-100 px-2 py-1 text-sm text-green-800"
                                >Aktiv</span
                            >
                        </div>
                        <p class="text-sm text-gray-500">15. Dezember 2024</p>
                        <div class="mt-2 flex justify-between">
                            <p class="text-sm">12 Anmeldungen</p>
                            <BaseLink to="/admin/competitions/1">
                                Details
                            </BaseLink>
                        </div>
                    </div>

                    <div class="border-b pb-4">
                        <div class="flex justify-between">
                            <h3 class="font-medium">Hamburg Triathlon</h3>
                            <span
                                class="rounded bg-green-100 px-2 py-1 text-sm text-green-800"
                                >Aktiv</span
                            >
                        </div>
                        <p class="text-sm text-gray-500">28. Januar 2025</p>
                        <div class="mt-2 flex justify-between">
                            <p class="text-sm">8 Anmeldungen</p>
                            <BaseLink to="/admin/competitions/2">
                                Details
                            </BaseLink>
                        </div>
                    </div>

                    <div class="border-b pb-4">
                        <div class="flex justify-between">
                            <h3 class="font-medium">München Marathon</h3>
                            <span
                                class="rounded bg-yellow-100 px-2 py-1 text-sm text-yellow-800"
                                >Bald</span
                            >
                        </div>
                        <p class="text-sm text-gray-500">10. März 2025</p>
                        <div class="mt-2 flex justify-between">
                            <p class="text-sm">Noch keine Anmeldungen</p>
                            <BaseLink to="/admin/competitions/3">
                                Details
                            </BaseLink>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Neueste Anmeldungen -->
            <div class="rounded-lg bg-white p-6 shadow-md">
                <div class="mb-6 flex items-center justify-between">
                    <h2 class="text-xl font-bold">Neueste Anmeldungen</h2>
                    <BaseLink to="/admin/registrations">
                        Alle anzeigen
                    </BaseLink>
                </div>

                <div class="space-y-4">
                    <div class="border-b pb-4">
                        <div class="flex justify-between">
                            <h3 class="font-medium">Peter Schmidt</h3>
                            <span
                                class="rounded bg-yellow-100 px-2 py-1 text-sm text-yellow-800"
                                >Ausstehend</span
                            >
                        </div>
                        <p class="text-sm text-gray-500">
                            Berliner Triathlon Cup
                        </p>
                        <div class="mt-2 flex justify-between">
                            <p class="text-sm text-gray-500">Vor 2 Stunden</p>
                            <div>
                                <BaseButton
                                    variant="text"
                                    color="green-600"
                                    class="mr-2"
                                >
                                    Bestätigen
                                </BaseButton>
                                <BaseButton variant="text" color="red-600">
                                    Ablehnen
                                </BaseButton>
                            </div>
                        </div>
                    </div>

                    <div class="border-b pb-4">
                        <div class="flex justify-between">
                            <h3 class="font-medium">Maria Musterfrau</h3>
                            <span
                                class="rounded bg-green-100 px-2 py-1 text-sm text-green-800"
                                >Bestätigt</span
                            >
                        </div>
                        <p class="text-sm text-gray-500">Hamburg Triathlon</p>
                        <p class="mt-2 text-sm text-gray-500">Vor 5 Stunden</p>
                    </div>

                    <div class="border-b pb-4">
                        <div class="flex justify-between">
                            <h3 class="font-medium">Max Mustermann</h3>
                            <span
                                class="rounded bg-green-100 px-2 py-1 text-sm text-green-800"
                                >Bestätigt</span
                            >
                        </div>
                        <p class="text-sm text-gray-500">
                            Berliner Triathlon Cup
                        </p>
                        <p class="mt-2 text-sm text-gray-500">Vor 1 Tag</p>
                    </div>

                    <div class="border-b pb-4">
                        <div class="flex justify-between">
                            <h3 class="font-medium">Anna Müller</h3>
                            <span
                                class="rounded bg-green-100 px-2 py-1 text-sm text-green-800"
                                >Bestätigt</span
                            >
                        </div>
                        <p class="text-sm text-gray-500">Hamburg Triathlon</p>
                        <p class="mt-2 text-sm text-gray-500">Vor 2 Tagen</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
