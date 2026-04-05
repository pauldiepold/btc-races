// Typen basieren auf der echten LADV-API-Antwort (ausDetail, Stand 2026-04-04)

export interface LadvWettbewerb {
  disziplin: string
  klasse: string
  disziplinNew: string
  klasseNew: string
}

export interface LadvOrt {
  id: number
  name: string
  lv: string
  land: string
  lng: number
  lat: number
}

export interface LadvAusschreibung {
  id: number
  name: string
  sportstaette: string
  meldAdresse: string
  meldEmail: string
  veranstalter: string
  ausrichter: string
  beschreibung: string
  datum: number // Unix-Timestamp in ms
  datumText: string
  meldDatum: number // Unix-Timestamp in ms
  meldDatumText: string
  abgesagt: boolean
  url: string
  wrc?: boolean
  tags: string
  kategorien: string[]
  ort: LadvOrt
  veranstaltungen: Array<{ id: number, name: string, url: string }>
  lvs: string
  landesverband: string[]
  links: Array<{ name: string, url: string }>
  attachements: Array<{ name: string, extension?: string, url: string }>
  wettbewerbe: LadvWettbewerb[]
}

export interface NormalizedLadvData {
  name: string
  date: string // YYYY-MM-DD (Berliner Ortszeit)
  location: string
  registration_deadline: string // YYYY-MM-DD (Berliner Ortszeit)
  announcement_link: string
  race_type: 'track' | 'road' // 'bahn' in kategorien → 'track', sonst 'road'
  is_wrc: 0 | 1
  championship_type: null // nicht in der LADV-API verfügbar
  ladv_data: LadvAusschreibung
}

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
