---
name: nuxt-og-image-skilld
description: "ALWAYS use when writing code importing \"nuxt-og-image\". Consult for debugging, best practices, or modifying nuxt-og-image, nuxt og image, og-image, og image."
metadata:
  version: 6.3.9
  generated_by: Anthropic · Haiku 4.5
  generated_at: 2026-04-11
---

# nuxt-modules/og-image `nuxt-og-image@6.3.9`
**Tags:** beta: 6.0.0, latest: 6.3.9

**References:** [package.json](./.skilld/pkg/package.json) • [README](./.skilld/pkg/README.md) • [Docs](./.skilld/docs/_INDEX.md) • [Issues](./.skilld/issues/_INDEX.md) • [Releases](./.skilld/releases/_INDEX.md)

## Search

Use `skilld search "query" -p nuxt-og-image` instead of grepping `.skilld/` directories. Run `skilld search --guide -p nuxt-og-image` for full syntax, filters, and operators.

<!-- skilld:api-changes -->
## API Changes

- BREAKING: Renderer dependencies no longer bundled — must install `@takumi-rs/core` (Node), `satori` + `@resvg/resvg-js` (Satori), or `playwright-core` (browser) explicitly [source](./.skilld/docs/content/6.migration-guide/v6.md:L35:66)

- BREAKING: OG Image component filenames require renderer suffix — `MyTemplate.vue` → `MyTemplate.takumi.vue`, `MyTemplate.satori.vue`, or `MyTemplate.browser.vue` [source](./.skilld/docs/content/6.migration-guide/v6.md:L69:94)

- BREAKING: `defineOgImage({ url })` syntax removed — use `useSeoMeta({ ogImage: '...' })` instead for pre-prepared images [source](./.skilld/docs/content/6.migration-guide/v6.md:L211:220)

- BREAKING: `<OgImage>` and `<OgImageScreenshot>` Vue components removed — use `defineOgImage()` and `defineOgImageScreenshot()` composables instead [source](./.skilld/docs/content/6.migration-guide/v6.md:L173:197)

- BREAKING: `defineOgImageComponent()` deprecated — renamed to `defineOgImage(component, props)`, identical API [source](./.skilld/docs/content/6.migration-guide/v6.md:L222:233)

- NEW: `defineOgImageSchema()` composable for Nuxt Content v3 integration — enables `ogImage` frontmatter key in content collections [source](./.skilld/docs/content/4.integrations/1.content.md:L14:31)

- NEW: URL signing feature prevents parameter tampering — configure via `NUXT_OG_IMAGE_SECRET` env or `security.secret` config, required in strict mode [source](./.skilld/docs/content/3.guides/13.security.md:L45:93)

- NEW: Auto-injection of title and description from `useSeoMeta()` into OG image props — automatically syncs meta tags to component props when defined [source](./.skilld/releases/CHANGELOG.md:L92)

- DEPRECATED: `html` option in `defineOgImage()` — disabled when `security.strict` is enabled, disabled due to SSRF risk, use Vue components instead [source](./.skilld/docs/content/4.api/0.define-og-image.md:L83:86)

- BREAKING: `#nuxt-og-image-utils` alias removed — update imports to `#og-image/shared` [source](./.skilld/docs/content/6.migration-guide/v6.md:L474:481)

- BREAKING: Chromium renderer renamed to `browser` — update component suffixes from `.chromium.vue` to `.browser.vue` and config references [source](./.skilld/docs/content/6.migration-guide/v6.md:L412:434)

- BREAKING: Community templates no longer bundled in production — must eject via `npx nuxt-og-image eject <TemplateName>` before building for production [source](./.skilld/docs/content/6.migration-guide/v6.md:L112:132)

- BREAKING: Nuxt Content v2 support removed — must upgrade to Nuxt Content v3, `strictNuxtContentPaths` config option removed [source](./.skilld/docs/content/6.migration-guide/v6.md:L383:410)

- NEW: Multiple OG images per page with `key` option — different images/dimensions for different platforms via `key: 'og' | 'twitter' | string` [source](./.skilld/docs/content/4.api/0.define-og-image.md:L114:134)

- BREAKING: `fonts` option deprecated — configure fonts via `@nuxt/fonts` module instead, Inter (400/700) bundled as zero-config fallback [source](./.skilld/docs/content/6.migration-guide/v6.md:L138:165)

**Also changed:** `ogImage.componentOptions` config removed · `browser: 'node'` binding removed (use `'playwright'`) · Query parameters no longer included in cache keys · OG image URL format changed to Cloudinary-style encoding (`/_og/s/...` instead of `/__og-image__/...`) · `useOgImageRuntimeConfig` import path changed to `#og-image/app/utils` · `sanitizeTakumiStyles` function removed · Sharp JPEG errors now throw instead of silently falling back
<!-- /skilld:api-changes -->

<!-- skilld:best-practices -->
## Nuxt OG Image v6.3.9 – Best Practices

## Best Practices

- Use **persistent storage** (Redis, Cloudflare KV, or NuxtHub) for runtime cache in production — the default in-memory cache is lost on server restart, causing images to be re-rendered on redeployment [source](./.skilld/docs/content/3.guides/3.runtime-cache.md#persistent-storage)

- **Use Takumi renderer as your default** (recommended) — it's 2-10x faster than Satori with complete CSS support including gradients, shadows, CSS Grid, transforms, and filters [source](./.skilld/docs/content/2.renderers/0.index.md#comparison)

- **Name OG image components with renderer suffixes** (`.takumi.vue`, `.satori.vue`, `.browser.vue`) for automatic detection and tree-shaking — unused renderer code is excluded from production builds [source](./.skilld/docs/content/2.renderers/0.index.md:L92:106)

- **Pass minimal props and fetch data inside the component** to keep runtime URLs short — encoding many props in the URL path adds HTML bloat to every page; pass a slug and use `$fetch()` inside your component instead [source](./.skilld/docs/content/3.guides/11.performance.md:L21:40)

- **Keep font sets static** across your OG image components — each unique font combination forces Satori to re-parse font binaries (~2x throughput hit); use a consistent set [source](./.skilld/docs/content/3.guides/11.performance.md:L66:71)

- **Use @nuxt/fonts module for custom fonts** (only supported method) — manual `@font-face` rules, global CSS, or CDN links do not work in OG image generation; fonts must be declared with `global: true` in your Nuxt config [source](./.skilld/docs/content/3.guides/5.custom-fonts.md:L1:45)

- **Enable build cache for CI/CD environments** to skip regenerating images with identical output between deployments — the cache automatically invalidates when options, templates, or module versions change [source](./.skilld/docs/content/3.guides/3.build-cache.md:L1:31)

- **For i18n, use Pattern 1** (pass pre-translated strings as props) over calling `useI18n()` inside your OG image component — OG images render as Nuxt Islands without locale context, making direct `useI18n()` unreliable [source](./.skilld/docs/content/4.integrations/3.i18n.md:L13:53)

- **Enable strict mode for production** to apply all recommended security defaults in one flag — enforces URL signing, disables inline HTML, limits query string size, and restricts generation to your site's origin [source](./.skilld/docs/content/3.guides/13.security.md:L28:38)

- **Use prerendering with Zero Runtime mode** when OG images don't change dynamically — removes all renderer code from production (81% smaller Nitro output) and serves prerendered images as static files [source](./.skilld/docs/content/3.guides/1.zero-runtime.md:L1:24)

- **Avoid dynamic image URLs** in your OG templates — use static, statically-analysable sources where possible; dynamic URLs trigger runtime fetches (100–500ms each) and dimension detection [source](./.skilld/docs/content/3.guides/11.performance.md:L66:71)

- **Use route-rule `ogImage` merging** to apply settings to a subset of pages without encoding them in the URL — props in route rules are resolved server-side, never encoded in the path [source](./.skilld/docs/content/3.guides/2.route-rules.md:L11:25)

- **Avoid wildcard route rules with caching** like `{ '/**': { swr: 60 * 4 } }` — this breaks OG image routes due to Nitro's inability to exclude specific routes from wildcard cache rules; use specific patterns instead [source](./.skilld/docs/content/3.guides/2.route-rules.md:L27:52)
<!-- /skilld:best-practices -->
