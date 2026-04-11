import type { EventPublicDetail, EventResponse } from '../types/events'

const OG_EXCERPT_MAX = 160

function formatOgDate(isoDate: string | null | undefined): string | null {
  if (!isoDate) return null
  const d = new Date(`${isoDate}T12:00:00`)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function excerptForOg(description: string | null | undefined): string | null {
  if (!description) return null
  const oneLine = description.replace(/\s+/g, ' ').trim()
  if (!oneLine) return null
  if (oneLine.length <= OG_EXCERPT_MAX) return oneLine
  return `${oneLine.slice(0, OG_EXCERPT_MAX - 1)}…`
}

export function isEventPublicDetail(e: EventResponse): e is EventPublicDetail {
  return 'registrationCounts' in e
}

export function generateEventOgDescription(event: EventResponse): string {
  const parts: string[] = []

  const dateStr = formatOgDate(event.date)
  if (dateStr) parts.push(dateStr)

  const locBits: string[] = []
  if (event.location) locBits.push(event.location)
  const sport = event.ladvData?.sportstaette
  if (sport && sport !== event.location) locBits.push(sport)
  const locationStr = locBits.join(' · ')
  if (locationStr) parts.push(locationStr)

  const excerpt = excerptForOg(event.description)
  if (excerpt) parts.push(excerpt)

  if (parts.length > 0) return parts.join(' · ')

  const name = event.name?.trim()
  if (name) return name

  return 'Wettkampf – Berlin Track Club'
}
