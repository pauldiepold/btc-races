// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxthub/core',
    'nuxt-auth-utils',
    '@pinia/nuxt',
    '@pinia/colada-nuxt',
    '@nuxt/image',
    'nuxt-email-renderer',
  ],

  devtools: { enabled: true },

  app: {
    head: {
      title: 'BTC Wettkampfanmeldung',
    },
  },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    campaiApiKeyContacts: '',
    campaiOrgId: '',
    cronToken: '',
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
      wasm: true, // NEU: Hilft manchmal bei binären Modulen
    },

    externals: {
      inline: [
        // Alle Azure-Pakete explizit inlinen
        '@azure/communication-email',
        '@azure/core-client',
        '@azure/core-rest-pipeline',
        '@azure/core-auth',
        '@azure/core-util',
        '@azure/abort-controller',
      ],
    },

    // NEU: Node.js Alias erzwingen
    alias: {
      'node:buffer': 'node:buffer',
      'node:process': 'node:process',
      'node:crypto': 'node:crypto',
      'node:stream': 'node:stream',
      'node:util': 'node:util',
    },

    // NEU: Rollup Config für externe Module
    rollupConfig: {
      external: [
        'node:buffer',
        'node:process',
        'node:crypto',
        'node:stream',
        'node:util',
      ],
    },
  },

  hub: {
    db: {
      dialect: 'sqlite',
      casing: 'snake_case',
    },
  },

  eslint: {
    config: {
      stylistic: true,
    },
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

  image: {
    domains: ['api.campai.com'],
  },
})
