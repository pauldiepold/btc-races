/**
 * Teilt einen Link über das native Teilen-Menü (Web Share API).
 * Fällt auf "Link kopieren" zurück, wo navigator.share fehlt (z. B. Firefox-Desktop).
 */
export function useShare() {
  const toast = useToast()

  async function share(data: { title: string, url: string }) {
    if (navigator.share) {
      try {
        await navigator.share(data)
      }
      catch (err) {
        // Nutzer hat das Teilen-Menü abgebrochen — kein Fehler
        if ((err as Error).name === 'AbortError') return
        toast.add({ title: 'Teilen fehlgeschlagen', color: 'error' })
      }
      return
    }

    // Fallback: Link in die Zwischenablage kopieren
    try {
      await navigator.clipboard.writeText(data.url)
      toast.add({ title: 'Link kopiert', color: 'success' })
    }
    catch {
      toast.add({ title: 'Konnte Link nicht kopieren', color: 'error' })
    }
  }

  return { share }
}
