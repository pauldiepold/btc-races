import { vi } from 'vitest'
import { encodeEventId } from '~~/server/utils/sqids'

// Nuxt-Auto-Imports stubben — Tests laufen im Node-Env ohne Nitro-Runtime.
vi.stubGlobal('useRuntimeConfig', () => ({
  public: { siteUrl: 'http://test.local' },
}))

vi.stubGlobal('encodeEventId', encodeEventId)
