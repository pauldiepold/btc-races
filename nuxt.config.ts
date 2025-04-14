import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  vite: {
    plugins: [tailwindcss()],
  },

  modules: [
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/ui',
    '@nuxtjs/supabase',
    '@nuxt/eslint',
    '@pinia/nuxt',
  ],

  runtimeConfig: {
    // Server-seitige Umgebungsvariablen
    emailSender: 'noreply@example.com',

    // Client-seitige Umgebungsvariablen
    public: {
      supabaseUrl: '',
      supabaseKey: '',
      appTitle: 'BTC Wettkampfanmeldung',
      appDescription: 'Anmeldesystem für Wettkämpfe des BTC',
      primaryColor: '#ffb700',
      secondaryColor: '#000000',
    },
  },

  // Supabase-Konfiguration
  supabase: {
    redirect: true,
    redirectOptions: {
      login: '/login',
      callback: '/auth/callback',
      exclude: ['/', '/competitions/**'],
    },
  },

  // CSS-Dateien
  css: ['~/assets/css/main.css'],

  // Kopfzeilen-Metadaten
  app: {
    head: {
      title: 'BTC Wettkampfanmeldung',
      meta: [
        {
          name: 'description',
          content: 'Anmeldesystem für Wettkämpfe des BTC',
        },
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    },
  },
})
