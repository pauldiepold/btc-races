import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  ssr: false,

  experimental: {
    viewTransition: true,
  },

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
    '@formkit/auto-animate',
  ],

  icon: {
    clientBundle: {
      scan: true,
      includeCustomCollections: true,
    },
  },

  runtimeConfig: {
    // Client-seitige Umgebungsvariablen
    public: {
      supabaseUrl: '',
      supabaseKey: '',
      appTitle: 'BTC Wettkampfanmeldung',
      appDescription: 'Anmeldesystem für Wettkämpfe des BTC',
      authProvider: 'azure',
    },
  },

  // Supabase-Konfiguration
  supabase: {
    redirect: true,
    redirectOptions: {
      login: '/login',
      callback: '/auth/callback',
      exclude: [
        '/',
        '/api/cron',
        '/competitions/**',
        '/registrations/confirm',
        '/registrations/cancel',
      ],
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
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon/favicon.ico' },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '32x32',
          href: '/favicon/favicon-32x32.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '16x16',
          href: '/favicon/favicon-16x16.png',
        },
        { rel: 'apple-touch-icon', href: '/favicon/apple-touch-icon.png' },
      ],
    },
  },
})
