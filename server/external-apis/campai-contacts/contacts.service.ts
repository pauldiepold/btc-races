export interface CampaiContact {
  _id: string
  personal: {
    avatar?: {
      path?: string
    }
    personFirstName?: string
    personLastName?: string
    email?: string
    [key: string]: unknown
  }
  communication?: {
    email?: string | null
    [key: string]: unknown
  }
  membership: {
    number?: string | null
    enterDate?: string | null
    leaveDate?: string | null
    sections?: string[]
    [key: string]: unknown
  }
}

export class CampaiContactsService {
  private readonly baseUrl = 'https://api.campai.com/contacts'
  private readonly apiKey: string
  private readonly orgId: string

  constructor() {
    const config = useRuntimeConfig()
    this.apiKey = config.campaiApiKeyContacts
    this.orgId = config.campaiOrgId

    if (!this.apiKey || !this.orgId) {
      throw new Error('Campai API Konfiguration fehlt (Key oder OrgID).')
    }
  }

  /**
   * Holt alle aktiven Mitglieder (Dedupliziert)
   */
  async getActiveMembers(): Promise<CampaiContact[]> {
    const today = new Date().toISOString().split('T')[0]

    // Parallelabfrage beider Szenarien (unbefristet & befristet aktiv)
    const [res1, res2] = await Promise.all([
      this.fetchAllPages({
        'membership.enterDate': `lte:${today}`,
        'membership.leaveDate': 'null',
      }),
      this.fetchAllPages({
        'membership.enterDate': `lte:${today}`,
        'membership.leaveDate': `gte:${today}`,
      }),
    ])

    // Ergebnisse zusammenführen und nach _id deduplizieren
    const all = [...res1, ...res2]
    return Array.from(new Map(all.map(c => [c._id, c])).values())
  }

  /**
   * Iteriert durch alle Datensätze mittels skip/limit
   */
  private async fetchAllPages(filters: Record<string, string>): Promise<CampaiContact[]> {
    const results: CampaiContact[] = []
    const limit = 100
    let skip = 0
    let keepFetching = true

    while (keepFetching) {
      const chunk = await this.fetchPage(filters, skip, limit)
      results.push(...chunk)

      if (chunk.length < limit) {
        keepFetching = false
      }
      else {
        skip += limit // Erhöhe skip für den nächsten "Batch"
      }
    }

    return results
  }

  /**
   * Führt den API-Call mit skip statt page aus
   */
  private async fetchPage(filters: Record<string, string>, skip: number, limit: number): Promise<CampaiContact[]> {
    try {
      return await $fetch<CampaiContact[]>(this.baseUrl, {
        headers: {
          Authorization: this.apiKey,
          Accept: 'application/json',
        },
        query: {
          mode: 'query',
          organisation: this.orgId,
          sort: 'membership.numberSort',
          limit: limit.toString(),
          skip: skip.toString(),
          ...filters,
        },
        retry: 2,
      })
    }
    catch (error) {
      console.error(`Campai API Fehler bei skip ${skip}:`, error)
      return []
    }
  }
}
