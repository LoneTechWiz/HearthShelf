# Testing Stack — Design

**Date:** 2026-06-07
**Status:** Approved

## Goal

Complete the project's testing stack for `apps/web`. A working Vitest unit/action
layer already exists (44 passing tests). This adds the three missing layers:
component/DOM testing, query-layer DB-integration testing, and Playwright E2E —
plus a Dockerized test database and a CI workflow.

## Current state (do not break)

- `apps/web/vitest.config.ts` — node environment, `@vitejs/plugin-react`, `@`
  alias, inlines `next-auth`/`@auth/core`.
- `apps/web/__tests__/lib/{isbn,open-library}.test.ts` — pure logic, `fetch`
  stubbed.
- `apps/web/__tests__/actions/{books,checkouts,contacts}.test.ts` — server-action
  logic; mock `@/auth`, `@/lib/queries/*`, `next/cache`, `next/navigation`.
- 44 tests pass via `npm test` (`vitest run`).

Architectural fact this relies on: actions (`lib/actions/*`) call into the query
layer (`lib/queries/*`), which is the only place that touches the DB. Unit tests
mock the query layer; integration tests exercise it for real.

## Key facts verified

- `next-auth@5.0.0-beta.31` + `@auth/drizzle-adapter`. With an adapter, Auth.js
  defaults to `strategy: "database"` (confirmed in
  `@auth/core/lib/init.js`: `strategy: config.adapter ? "database" : "jwt"`).
  Sessions live in the `sessions` table; the session cookie value **is** the
  `sessionToken`.
- Session cookie name over local http is `authjs.session-token` (the
  `__Secure-` prefix is only used over https).
- Docker + Compose available. Local PostgreSQL 18 available. The dev
  `DATABASE_URL` points to **Supabase (remote/shared)** — tests must never use it.

## Decisions

- **Scope:** component testing + DB-integration testing + E2E.
- **E2E auth:** seed a user + session row in the test DB, set the
  `authjs.session-token` cookie via Playwright `storageState`. No production code
  changes.
- **Test DB:** local Docker Postgres (disposable), schema via `drizzle-kit push`.
- **CI:** GitHub Actions running all layers.

## Layer matrix

| Layer | Runner | Env | DB | In default `npm test`? |
|---|---|---|---|---|
| Unit/action (exists) | Vitest | node | mocked | yes |
| Component/DOM | Vitest | jsdom | n/a | yes |
| Query integration | Vitest | node | real test DB | no (own command) |
| E2E | Playwright | chromium | real test DB | no (own command) |

The two DB-backed layers stay out of the default `npm test` so it remains fast
and needs no Docker.

## 1. Component testing (Vitest, jsdom)

**New devDeps:** `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`,
`@testing-library/user-event`.

**Config:** convert `vitest.config.ts` to use `test.projects`:

- Project `unit`: `environment: 'node'`, include
  `['__tests__/lib/**/*.test.ts', '__tests__/actions/**/*.test.ts']`.
- Project `components`: `environment: 'jsdom'`, include
  `['__tests__/components/**/*.test.tsx']`, `setupFiles: ['./vitest.setup.ts']`.

Shared `plugins`, `resolve.alias`, and `server.deps.inline` settings are kept
(hoisted so both projects inherit them).

**`vitest.setup.ts`** imports `@testing-library/jest-dom/vitest` and registers an
`afterEach(cleanup)`.

**Example tests:**
- `__tests__/components/theme-toggle.test.tsx` — wraps `ThemeToggle` in a
  `next-themes` provider; asserts the button cycles System → Light → Dark on
  click and that `aria-label` reflects the next theme.
- `__tests__/components/contact-form.test.tsx` — renders `ContactForm`; asserts
  required-field markers render and labels are associated with inputs.

`next-themes` reads/writes `localStorage` and `matchMedia`; the setup file stubs
`window.matchMedia` (jsdom lacks it).

## 2. DB-integration testing (Vitest, real Postgres)

**New file:** `apps/web/vitest.integration.config.ts`:

- `environment: 'node'`, include `['__tests__/integration/**/*.test.ts']`.
- `globalSetup: ['./__tests__/integration/global-setup.ts']` — pushes the Drizzle
  schema to the test DB (idempotent) before the run.
- `fileParallelism: false` (serial) so tests don't race on shared tables.
- Shared `resolve.alias` as in the main config.

**`__tests__/integration/helpers.ts`** exports `truncateAll()` (TRUNCATE the app
tables `book`, `contact`, `checkout` plus auth tables, RESTART IDENTITY CASCADE)
and a `db` import. Tests call `truncateAll()` in `beforeEach`.

**Reset/seed:** integration tests seed their own rows through the query/db layer.

**Example test:** `__tests__/integration/queries/books.test.ts` — using a seeded
user id, `createBookRecord` then read it back via the books query, assert fields;
`deleteBookRecord` then assert it is gone. Verifies real Drizzle SQL against
Postgres.

## 3. E2E testing (Playwright)

**New devDep:** `@playwright/test`.

**`apps/web/playwright.config.ts`:**
- `testDir: './e2e'`.
- `use`: `baseURL: 'http://localhost:3100'`,
  `storageState: 'playwright/.auth/user.json'`.
- `webServer`: `command: 'npm run start:e2e'`, `url: 'http://localhost:3100'`,
  `reuseExistingServer: !process.env.CI`, `timeout` generous for first compile.
- `globalSetup: './e2e/global-setup.ts'`.
- Projects: a `setup` project is not needed since global-setup writes
  storageState; a single `chromium` project consumes it. One unauthenticated test
  overrides `storageState: { cookies: [], origins: [] }` inline.

**`apps/web/package.json` script** `start:e2e`:
`dotenv -e .env.test -- next dev -p 3100` (local). In CI the same command runs;
generous `webServer.timeout` absorbs first-compile time.

**`e2e/global-setup.ts`:**
1. Connect to the test DB (from `.env.test`, loaded by the `test:e2e` script).
2. `truncateAll()` (reuse the integration helper).
3. Insert a user row (fixed id `e2e-user`, email `e2e@example.com`).
4. Insert a `sessions` row: `sessionToken` = a generated value, `userId` =
   `e2e-user`, `expires` = now + 7 days.
5. Write `playwright/.auth/user.json` storageState with one cookie:
   name `authjs.session-token`, value = the `sessionToken`, domain `localhost`,
   path `/`, `httpOnly: true`, `sameSite: 'Lax'`, an expiry in the future.

**Example specs (`apps/web/e2e/`):**
- `auth.spec.ts` — with storageState cleared, navigating to `/books` redirects to
  `/`. With storageState, `/books` renders the library.
- `books.spec.ts` — authenticated: create a book via the form, assert it appears
  in the list; uses a unique title per run.
- `dark-mode.spec.ts` — authenticated: toggle theme via the nav control, assert
  `<html class="dark">` and persistence across reload.

Tests create uniquely-named entities so they tolerate shared DB state within a
run; `global-setup` truncates once before the run.

## 4. Test database (Docker)

**`docker-compose.test.yml`** (repo root):
- service `db-test`: image `postgres:18`, env
  `POSTGRES_USER=postgres POSTGRES_PASSWORD=postgres POSTGRES_DB=postgres`,
  ports `5433:5432`, no named volume (ephemeral), a `healthcheck` using
  `pg_isready`.

**`apps/web/.env.test` is gitignored — never committed.** Add `.env.test` to
`apps/web/.gitignore` (the Next.js default ignores `.env` and `.env*.local` but
not `.env.test`). The file is created locally and in CI, not stored in git.

**`apps/web/.env.test.example`** (committed) documents the shape:
```
# Copy to .env.test (gitignored). Local test DB from docker-compose.test.yml.
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/postgres
# Generate a value: openssl rand -base64 32
AUTH_SECRET=
```

**Local setup:** `npm run test:env:init` (new script) copies
`.env.test.example` → `.env.test` if absent and fills `AUTH_SECRET` with a freshly
generated value; it never overwrites an existing `.env.test`. The DB creds are
non-secret local Docker values; the only generated secret is `AUTH_SECRET`.

Note: with the database session strategy, `AUTH_SECRET` is not used to verify the
seeded session (the cookie value is looked up directly in the `sessions` table);
it is set only because NextAuth requires it to initialize.

**New devDep:** `dotenv-cli` (loads `.env.test` for drizzle-kit and the runners).

## 5. Scripts

`apps/web/package.json`:
```
test              vitest run
test:watch        vitest
test:integration  dotenv -e .env.test -- vitest run -c vitest.integration.config.ts
test:e2e          dotenv -e .env.test -- playwright test
start:e2e         dotenv -e .env.test -- next dev -p 3100
test:db:up        docker compose -f ../../docker-compose.test.yml up -d --wait
test:db:down      docker compose -f ../../docker-compose.test.yml down -v
db:push:test      dotenv -e .env.test -- drizzle-kit push
test:env:init     node scripts/init-test-env.mjs   # create .env.test if absent
```

`scripts/init-test-env.mjs` (apps/web): if `.env.test` does not exist, copy
`.env.test.example` to `.env.test` and replace the empty `AUTH_SECRET=` with
`AUTH_SECRET=<crypto.randomBytes(32).toString('base64')>`. If `.env.test` already
exists, do nothing. Pure Node (`node:fs`, `node:crypto`), no extra deps.

Root `package.json` proxies:
```
test       npm run test --workspace=apps/web
test:e2e   npm run test:e2e --workspace=apps/web
```

Local DB-backed run sequence:
`npm run test:env:init` (first time) → `npm run test:db:up` →
`npm run db:push:test` → `npm run test:integration` and/or `npm run test:e2e` →
`npm run test:db:down`.

## 6. CI (GitHub Actions)

**`.github/workflows/test.yml`**, triggered on pull requests and pushes to `main`:
- `services.postgres`: `postgres:18` on `5432`, health-checked.
- Steps: checkout; `actions/setup-node` (Node 20, npm cache);
  `npm ci --legacy-peer-deps`; **generate `apps/web/.env.test`** (see below);
  push schema (`db:push:test`); `npm test` (unit + component);
  `npm run test:integration`; `npx playwright install --with-deps chromium`;
  `npm run test:e2e`.
- The `.env.test` is created at runtime, never committed:
  ```
  printf 'DATABASE_URL=%s\nAUTH_SECRET=%s\n' \
    "postgresql://postgres:postgres@localhost:5432/postgres" \
    "$(openssl rand -base64 32)" > apps/web/.env.test
  ```
  This points at the CI service on `5432` (local uses `5433`) and generates a
  fresh `AUTH_SECRET`, keeping the `dotenv -e .env.test` scripts uniform across
  local and CI.

## Verification

- `npm test` green, including the new component project; existing 44 tests still
  pass.
- With Docker up and schema pushed: `npm run test:integration` green.
- `npm run test:e2e` green locally (or, if blocked, see risk below).
- CI workflow green on a PR.

## Risks / known constraints

- **Playwright browser download:** `playwright install` needs network and may hit
  this sandbox's install-script restrictions. If chromium cannot be fetched here,
  the E2E config, global-setup, and specs are written and statically verified, and
  the actual `test:e2e` run is deferred to the user's machine / CI. This will be
  called out explicitly during implementation rather than reported as passing.
- **`next dev` on first request** is slow to compile; `webServer.timeout` is set
  high enough to absorb it.
- **CI vs local port:** local test DB is on 5433 (to avoid clashing with any
  local PG), CI service is on 5432; handled by the job env override noted above.

## Out of scope

- `apps/mobile` (placeholder) and `packages/types` (types only).
- Visual-regression / screenshot-diff testing.
- Coverage thresholds / reporters (can be added later).
