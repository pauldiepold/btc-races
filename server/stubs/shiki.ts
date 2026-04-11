/**
 * Shiki stub — ersetzt die vollständige Shiki-Bibliothek im Nitro-Bundle.
 *
 * ECodeBlock aus nuxt-email-renderer importiert shiki dynamisch, zieht dabei
 * aber alle ~200 Sprach-Grammars als separate Chunks rein. Da wir ECodeBlock
 * in keinem Email-Template nutzen, reicht ein No-Op-Stub.
 */
export async function createHighlighter() {
  return {
    codeToHtml: () => '',
    getTheme: () => ({ bg: '#ffffff' }),
    dispose: () => {},
  }
}
