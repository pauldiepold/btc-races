import type { LadvAusschreibung, NormalizedLadvData } from '~~/shared/types/ladv'

// URL-Format: https://ladv.de/ausschreibung/detail/42008/Abendsportfest-Berlin-Zehlendorf.htm
export function parseLadvIdFromUrl(url: string): number | null {
  const match = url.match(/\/ausschreibung\/detail\/(\d+)\//)
  if (!match || !match[1]) return null
  return parseInt(match[1], 10)
}

const berlinDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Berlin',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const berlinTimeFormatter = new Intl.DateTimeFormat('de-DE', {
  timeZone: 'Europe/Berlin',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

function timestampToDate(ms: number): string {
  return berlinDateFormatter.format(new Date(ms))
}

/**
 * Extrahiert die Berliner Uhrzeit aus einem LADV-Timestamp.
 * Gibt null zurück wenn die Zeit 00:00 ist (LADV-Konvention für "kein Startzeitpunkt").
 */
export function timestampToTime(ms: number): string | null {
  const time = berlinTimeFormatter.format(new Date(ms))
  return time === '00:00' ? null : time
}

export function normalizeLadvData(raw: LadvAusschreibung): NormalizedLadvData {
  return {
    name: raw.name,
    date: timestampToDate(raw.datum),
    start_time: timestampToTime(raw.datum),
    location: [raw.ort.name, raw.sportstaette].filter(Boolean).join(' · '),
    registration_deadline: timestampToDate(raw.meldDatum),
    race_type: raw.kategorien.includes('bahn') ? 'track' : 'road',
    is_wrc: (raw.wrc ?? false) ? 1 : 0,
    championship_type: null,
    ladv_data: raw,
  }
}
