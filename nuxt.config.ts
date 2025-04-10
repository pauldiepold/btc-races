import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  vite: {
    plugins: [
      tailwindcss(),
    ],
  },

  modules: [
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/ui',
    '@nuxtjs/supabase',
  ],

  runtimeConfig: {
    // Server-seitige Umgebungsvariablen
    emailSender: process.env.EMAIL_SENDER || 'noreply@example.com',

    // Client-seitige Umgebungsvariablen
    public: {
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabaseKey: process.env.SUPABASE_KEY || '',
      appTitle: 'BTC Wettkampfanmeldung',
      appDescription: 'Anmeldesystem für Wettkämpfe des BTC',
      primaryColor: '#ffb700',
      secondaryColor: '#000000',
    },
  },

  // Supabase-Konfiguration
  supabase: {
    redirect: false,
  },

  // CSS-Dateien
  css: [
    '~/assets/css/main.css',
  ],

  // Kopfzeilen-Metadaten
  app: {
    head: {
      title: 'BTC Wettkampfanmeldung',
      meta: [
        { name: 'description', content: 'Anmeldesystem für Wettkämpfe des BTC' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ],
    },
  },
})
