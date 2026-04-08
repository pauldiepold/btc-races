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
  ],

  devtools: { enabled: true },

  app: {
    head: {
      title: 'BTC Wettkampfanmeldung',
    },
  },
  css: ['~/assets/css/main.css'],

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
  },

  hub: {
    db: {
      dialect: 'sqlite',
      casing: 'snake_case',
    },
  },
  vite: {
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

})
