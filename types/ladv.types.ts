/**
 * Typdefinitionen für die LADV-API
 */

export interface LadvLocation {
  id: number
  name: string
  lv: string
  land: string
  lng: number
  lat: number
}

export interface LadvCompetition {
  id: number
  name: string
  sportstaette: string
  meldAdresse: string
  meldEmail: string
  veranstalter: string
  ausrichter: string
  beschreibung: string
  datum: number
  datumText: string
  bisDatum?: number
  bisDatumText?: string
  meldDatum: number
  meldDatumText: string
  abgesagt: boolean
  wrc: boolean
  url: string
  tags: string
  ort: LadvLocation
  veranstaltungen?: Array<{
    id: number
    name: string
    url: string
  }>
  lvs?: string
  links?: Array<{
    name: string
    url: string
  }>
  attachements?: Array<{
    name: string
    extension: string
    url: string
  }>
  wettbewerbe: Array<{
    disziplin: string
    klasse: string
  }>
} 