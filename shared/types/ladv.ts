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
  start_time: string | null // HH:MM, null wenn LADV keine echte Zeit liefert (00:00)
  location: string
  registration_deadline: string // YYYY-MM-DD (Berliner Ortszeit)
  race_type: 'track' | 'road'
  is_wrc: 0 | 1
  championship_type: null
  ladv_data: LadvAusschreibung
}
