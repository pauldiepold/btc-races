import type { LadvAusschreibung, NormalizedLadvData } from '~~/shared/types/ladv'

// URL-Format: https://ladv.de/ausschreibung/detail/42008/Abendsportfest-Berlin-Zehlendorf.htm
export function parseLadvIdFromUrl(url: string): number | null {
  const match = url.match(/\/ausschreibung\/detail\/(\d+)\//)
  if (!match || !match[1]) return null
  return parseInt(match[1], 10)
}

function timestampToDate(ms: number): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(ms))
}

export function normalizeLadvData(raw: LadvAusschreibung): NormalizedLadvData {
  return {
    name: raw.name,
    date: timestampToDate(raw.datum),
    location: raw.ort.name,
    registration_deadline: timestampToDate(raw.meldDatum),
    announcement_link: raw.url,
    race_type: raw.kategorien.includes('bahn') ? 'track' : 'road',
    is_wrc: (raw.wrc ?? false) ? 1 : 0,
    championship_type: null,
    ladv_data: raw,
  }
}
