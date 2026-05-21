export type Platform = 'ios' | 'android' | 'desktop'

/**
 * Erkennt die Plattform anhand des User-Agents.
 *
 * iPadOS meldet sich seit iOS 13 als „Macintosh" — daher zusätzlich die
 * Touch-Punkte prüfen, um ein iPad sicher als iOS einzuordnen.
 */
export function detectPlatform(userAgent: string, maxTouchPoints = 0): Platform {
  const ua = userAgent.toLowerCase()

  if (/iphone|ipad|ipod/.test(ua)) return 'ios'
  if (/macintosh/.test(ua) && maxTouchPoints > 1) return 'ios'
  if (/android/.test(ua)) return 'android'

  return 'desktop'
}
