import { describe, expect, it } from 'vitest'
import { renderMarkdown } from '../../../../shared/utils/markdown'

describe('renderMarkdown', () => {
  it('renders bold text', () => {
    expect(renderMarkdown('**fett**')).toContain('<strong>fett</strong>')
  })

  it('renders italic text', () => {
    expect(renderMarkdown('*kursiv*')).toContain('<em>kursiv</em>')
  })

  it('renders an unordered list', () => {
    const html = renderMarkdown('- eins\n- zwei')
    expect(html).toContain('<ul>')
    expect(html).toContain('<li>eins</li>')
    expect(html).toContain('<li>zwei</li>')
  })

  it('renders an ordered list', () => {
    const html = renderMarkdown('1. eins\n2. zwei')
    expect(html).toContain('<ol>')
    expect(html).toContain('<li>eins</li>')
  })

  it('renders a link with the visible text', () => {
    const html = renderMarkdown('[BTC](https://berlin-track-club.de)')
    expect(html).toContain('href="https://berlin-track-club.de"')
    expect(html).toContain('>BTC</a>')
  })

  it('opens links in a new tab safely', () => {
    const html = renderMarkdown('[BTC](https://berlin-track-club.de)')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
  })

  it('renders inline code', () => {
    expect(renderMarkdown('Nutze `pnpm dev`')).toContain('<code>pnpm dev</code>')
  })

  it('renders a fenced code block', () => {
    const html = renderMarkdown('```\nconst x = 1\n```')
    expect(html).toContain('<pre>')
    expect(html).toContain('<code>const x = 1\n</code>')
  })
})

describe('renderMarkdown — XSS sanitization', () => {
  it('neutralizes a raw script tag', () => {
    const html = renderMarkdown('<script>alert(1)</script>')
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('</script>')
  })

  it('does not turn a javascript: URL into a clickable link', () => {
    const html = renderMarkdown('[klick](javascript:alert(1))').toLowerCase()
    expect(html).not.toContain('<a ')
    expect(html).not.toContain('href="javascript:')
  })

  it('neutralizes an img tag with an onerror handler', () => {
    const html = renderMarkdown('<img src=x onerror="alert(1)">')
    expect(html).not.toContain('<img')
    expect(html).not.toContain('onerror="')
  })

  it('neutralizes an iframe tag', () => {
    const html = renderMarkdown('<iframe src="https://evil.example"></iframe>')
    expect(html).not.toContain('<iframe')
    expect(html).not.toContain('</iframe>')
  })

  it('neutralizes embedded style and event attributes on a raw tag', () => {
    const html = renderMarkdown(
      '<div style="position:fixed" onclick="alert(1)">text</div>',
    )
    expect(html).not.toContain('<div')
    expect(html).not.toContain('onclick="')
    expect(html).not.toContain('style="')
  })
})
