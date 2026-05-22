import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({ html: false })

// Links immer sicher in neuem Tab öffnen.
const defaultLinkOpen
  = md.renderer.rules.link_open
    ?? ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))

md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  tokens[idx]!.attrSet('target', '_blank')
  tokens[idx]!.attrSet('rel', 'noopener noreferrer')
  return defaultLinkOpen(tokens, idx, options, env, self)
}

/**
 * Rendert rohes Markdown zu sanitisiertem HTML.
 *
 * Roh-Markdown wird gespeichert, das Sanitizing passiert hier beim Rendern.
 * `html: false` lässt eingebetteten Roh-HTML als Text escapen (kein `<script>`,
 * `<iframe>`, `on*`-Handler gelangt ins Markup), `javascript:`-URLs werden vom
 * eingebauten `validateLink` von markdown-it geblockt.
 *
 * Edge-Runtime-kompatibel — markdown-it ist pure JS ohne Node-Abhängigkeiten.
 */
export function renderMarkdown(text: string): string {
  return md.render(text)
}
