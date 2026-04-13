import { resolve } from 'node:path'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxthub/core',
    'nuxt-auth-utils',
    '@pinia/nuxt',
    '@pinia/colada-nuxt',
    'nuxt-email-renderer',
    '@nuxt/fonts',
    'nuxt-og-image',
  ],

  devtools: { enabled: true },

  app: {
    head: {
      title: 'BTC Events',
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
    session: {
      password: '',
      maxAge: 2678400,
    },
    public: {
      siteUrl: process.env.CF_PAGES_URL || 'http://localhost:3000',
    },
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

})
