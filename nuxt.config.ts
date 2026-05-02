import { resolve } from 'node:path'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxthub/core',
    'nuxt-auth-utils',
    '@pinia/nuxt',
    'nuxt-email-renderer',
    '@nuxt/fonts',
    'nuxt-og-image',
    '@nuxt/scripts',
    '@nuxtjs/turnstile',
    '@vite-pwa/nuxt',
  ],

  devtools: { enabled: true },

  app: {
    head: {
      title: 'Berlin Track Club',
      link: [
        { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
        { rel: 'icon', href: '/logo-yellow.svg', sizes: 'any', type: 'image/svg+xml' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon-180x180.png' },
      ],
    },
  },
  css: ['~/assets/css/main.css'],

  site: {
    url: process.env.CF_PAGES_URL || 'http://localhost:3000',
  },

  colorMode: {
    preference: 'dark',
  },

  runtimeConfig: {
    campaiApiKeyContacts: '',
    campaiOrgId: '',
    cronToken: '',
    ladvApiKey: '',

    // E-Mail-Konfiguration
    emailProvider: 'local',
    emailAzureString: '',
    emailSenderAddress: '',
    emailTestMode: false,
    emailTestAddress: '',

    // Web Push (VAPID)
    vapidPrivateKey: '',
    vapidSubject: 'mailto:info@btc-races.de',

    turnstile: {
      secretKey: '', // override: NUXT_TURNSTILE_SECRET_KEY
    },
    session: {
      password: '',
      maxAge: 2678400,
    },
    public: {
      siteUrl: process.env.CF_PAGES_URL || 'http://localhost:3000',
      vapidPublicKey: '',
      turnstileSiteKey: '',
    },
  },

  routeRules: {
    '/profil': { redirect: '/profil/meine-anmeldungen' },
    '/meine-anmeldungen': { redirect: '/profil/meine-anmeldungen' },
    '/events': { redirect: '/' },
  },

  compatibilityDate: '2025-12-29',

  nitro: {
    experimental: {
      tasks: true,
    },
    alias: {
      // ECodeBlock aus nuxt-email-renderer importiert shiki dynamisch und
      // zieht ~200 Sprach-Grammars ins Worker-Bundle. Da wir ECodeBlock
      // nicht verwenden, reicht ein No-Op-Stub.
      shiki: resolve('./server/stubs/shiki.ts'),
    },
  },

  hub: {
    db: {
      dialect: 'sqlite',
      casing: 'snake_case',
    },
    kv: true,
  },
  vite: {
    build: {
      sourcemap: false,
    },
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        'zod',
        'workbox-precaching',
        'workbox-routing',
        '@internationalized/date',
      ],
    },
  },

  eslint: {
    config: {
      stylistic: true,
    },
  },

  fonts: {
    families: [
      { name: 'Raleway', provider: 'google', weights: [400, 500, 600, 700] },
      { name: 'Space Grotesk', provider: 'google', weights: [500, 600, 700] },
    ],
  },

  icon: {
    mode: 'css',
    cssLayer: 'base',
    clientBundle: {
      scan: true,
    },
    customCollections: [{
      prefix: 'btc',
      dir: './app/assets/icons',
    }],
  },

  ogImage: {
    zeroRuntime: false,
    defaults: {
      cacheMaxAgeSeconds: 60 * 60 * 24,
    },
  },

  pwa: {
    strategies: 'injectManifest',
    srcDir: 'service-worker',
    filename: 'sw.ts',
    registerType: 'autoUpdate',
    injectManifest: {
      globPatterns: [],
    },
    manifest: {
      name: 'Berlin Track Club',
      short_name: 'Berlin Track Club',
      description: 'Wettkampf & Trainingsverwaltung des Berlin Track Clubs',
      lang: 'de',
      theme_color: '#ffb700',
      background_color: '#18181b',
      display: 'standalone',
      start_url: '/',
      icons: [
        { src: '/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        { src: '/maskable-icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
        { src: '/pwa-64x64.png', sizes: '64x64', type: 'image/png', purpose: 'any' },
        { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      ],
      shortcuts: [
        {
          name: 'Wettkämpfe',
          url: '/',
          description: 'Alle aktuellen Wettkämpfe',
          icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
        },
        {
          name: 'Meine Anmeldungen',
          url: '/profil/meine-anmeldungen',
          description: 'Eigene Anmeldungen einsehen',
          icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
        },
      ],
    },
    devOptions: {
      enabled: true,
      type: 'module',
    },
  },

})
