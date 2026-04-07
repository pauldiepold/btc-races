import type { LadvAusschreibung, NormalizedLadvData } from '~~/shared/types/ladv'
import { normalizeLadvData } from '../../utils/ladv'

const BASE_URL = 'https://ladv.de/api'

export class LadvService {
  private readonly apiKey: string

  constructor() {
    const config = useRuntimeConfig()
    this.apiKey = config.ladvApiKey

    if (!this.apiKey) {
      throw new Error('LADV API Key fehlt (NUXT_LADV_API_KEY)')
    }
  }

  async fetchAusschreibung(ladvId: number): Promise<NormalizedLadvData> {
    const data = await $fetch<LadvAusschreibung[]>(
      `${BASE_URL}/${this.apiKey}/ausDetail`,
      { query: { id: ladvId, all: true, wettbewerbe: true } },
    )

    const raw = data[0]
    if (!raw) {
      throw new Error(`LADV: Keine Ausschreibung gefunden für ID ${ladvId}`)
    }

    return normalizeLadvData(raw)
  }
}
