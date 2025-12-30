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
    session: {
      password: '',
      maxAge: 2678400,
    },
    // E-Mail-Konfiguration
    emailProvider: 'local',
    emailAzureString: '',
    emailSenderAddress: '',
    emailTestMode: false,
    emailTestAddress: '',
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
