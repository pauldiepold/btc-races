import { vi } from 'vitest'

// Nuxt-Auto-Imports stubben — Tests laufen im Node-Env ohne Nitro-Runtime.
vi.stubGlobal('useRuntimeConfig', () => ({
  public: { siteUrl: 'http://test.local' },
}))
