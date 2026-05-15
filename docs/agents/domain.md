# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root — the shared glossary for architecture decisions and code reviews.
- **`docs/adr/`** — read ADRs that touch the area you're about to work in.

If `docs/adr/` doesn't exist yet, **proceed silently**. Don't flag its absence; don't suggest creating it upfront. The producer skill (`/grill-with-docs`) creates ADRs lazily when decisions actually get resolved.

## File structure

Single-context repo:

```
/
├── CONTEXT.md
├── docs/adr/         ← created lazily by /grill-with-docs
└── ...
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

Examples from this repo's `CONTEXT.md`:

- Use **Event-Typ-Capabilities** (not "event flags" / "event config").
- Use **Aktor: Self / Admin** (not "user role" / "permission"). The HTTP-level distinction admin vs. superuser is *not* a domain concept.
- Use **Wunschstand** (`wishDisciplines`) vs. **LADV-Stand** (`ladvDisciplines`) — never blur them into one "disciplines" term.
- Use **Stand-Harmonisierung** for the rule that Coach-Aktionen end in `wishDisciplines := ladvDisciplines`.

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/grill-with-docs`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 — but worth reopening because…_
