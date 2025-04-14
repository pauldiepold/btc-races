import { z } from 'zod'
import i18next from 'i18next'
import { zodI18nMap } from 'zod-i18n-map'
import translation from 'zod-i18n-map/locales/de/zod.json'

export function useZodLocalization() {
  if (!i18next.isInitialized) {
    i18next.init({
      lng: 'de',
      resources: {
        de: { zod: translation },
      },
    })
    z.setErrorMap(zodI18nMap)
  }
} 