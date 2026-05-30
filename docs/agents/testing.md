# Testing

What to test and how — binding for any test work in this repo, whether test-first
(`/tdd`) or backfilling missing coverage (`/test`).

Setup: `vitest`. Run `pnpm test` (once) or `pnpm test:watch`. Tests live in
`test/unit/`.

## What to test

Test **behaviour through the public interface** — not private functions, not the
shape of data structures. A test should survive an internal refactor.

Two patterns:

- **Pure utils** (`server/utils/`, `shared/utils/`) — pure-function tests, input
  → output. State machines, deadline checks, diff detection, data mapping (e.g.
  LADV-response normalisation), Zod schemas, business rules.
- **Persistence modules** (`server/registration/`, `server/events/`,
  notification logic) — tested through the **public module API**, not via direct
  Drizzle queries in the test. Use `createTestDb()` from
  `test/helpers/test-db.ts`: a libsql in-memory DB per test, all migrations
  applied, isolated. This is **not a mock** — it is a real DB, and internal
  collaborators are not mocked. Template: `test/unit/infra/test-db.smoke.test.ts`.

## What not to test

Nitro event handlers / API routes, Vue components, Nuxt composables, pure display
logic (badge colours, label text).

This is **architectural, not a shortcut**: logic lives deliberately in modules and
utils; handlers and composables are thin adapters with nothing testable.

**Drift rule:** real logic found in a handler or composable (state machine,
deadline check, diff, non-trivial transform) is an *extraction* signal, not a test
signal. Move it to `server/utils/`, `shared/utils/` or the owning module, then
test it there. The handler/composable stays thin.

## How persistence modules get the DB

Persistence modules **never import `hub:db` directly**. They take the Drizzle DB as
their **first parameter** (`db: AppDb`), where `AppDb = typeof hubDb` (declared in
`server/registration/persistence.ts`; declare the same `type AppDb = typeof hubDb`
locally in a new module area). The API handler injects the real DB from `hub:db`;
the test injects the in-memory `createTestDb()` instance. Same code path, no mock —
this dependency injection is the whole reason the module is testable.

```ts
// module — server/<area>/<thing>.ts
import type { db as hubDb } from 'hub:db'
import * as schema from '~~/server/db/schema'
type AppDb = typeof hubDb
export async function buildOverview(db: AppDb) { /* real Drizzle queries */ }

// handler — thin adapter, no logic
import { db } from 'hub:db'
export default defineEventHandler(() => buildOverview(db))

// test — real DB, public API
const { db } = await createTestDb()
expect(await buildOverview(db)).toEqual(/* … */)
```

## Conventions

- Layout mirrors the source tree: `test/unit/server/registration/…`,
  `test/unit/server/utils/…`, `test/unit/shared/utils/…`, `test/unit/infra/…`
- Import modules via the `~~` alias (`~~/server/registration`,
  `~~/shared/utils/registration`); defined in `vitest.config.ts`.
- Import test helpers relatively (`../../../helpers/test-db`,
  `../../../helpers/notification-jobs`).
- `test/setup.ts` stubs Nuxt auto-imports globally — no per-test stubbing needed.
- `describe`/`it` names in English, phrased as behaviour ("user can …"), not as
  implementation.
