// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxthub/core',
    'nuxt-auth-utils',
    '@pinia/nuxt',
    '@pinia/colada-nuxt',
  ],

  devtools: { enabled: true },

  app: {
    head: {
      title: 'BTC Wettkampfanmeldung',
    },
  },
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2025-07-15',

  nitro: {
    experimental: {
      tasks: true,
    },
  },

  hub: {
    db: {
      dialect: 'sqlite',
      casing: 'snake_case',
      // driver: 'd1',
      // connection: { databaseId: '377c148c-ff3e-486f-b0a6-866e3de24e1d' },
    },
  },
  typescript: {
    typeCheck: true,
  },

  eslint: {
    config: {
      stylistic: true,
    },
  },
})
