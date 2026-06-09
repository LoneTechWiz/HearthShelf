# Testing Stack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add component (jsdom), DB-integration (real Postgres), and Playwright E2E testing to `apps/web`, plus a Dockerized test DB and a CI workflow — without breaking the existing 44 passing unit/action tests.

**Architecture:** Vitest runs two fast, mock-only projects (`unit` node + `components` jsdom) under `npm test`. Two DB-backed layers run via separate commands against a disposable Docker Postgres: query-integration (Vitest, own config) and E2E (Playwright). E2E auth is bypassed by seeding a `user` + `session` row in the test DB and setting the `authjs.session-token` cookie via Playwright `storageState` (Auth.js uses database sessions, so the cookie value is the session token — no production code changes).

**Tech Stack:** Vitest 4, @testing-library/react, jsdom, Playwright, Drizzle/postgres, Docker Compose, dotenv-cli, GitHub Actions.

---

## Notes for the implementer

- Run all `npm`/`npx` commands from `apps/web/` unless stated. Installs require `--legacy-peer-deps`.
- The Drizzle client (`apps/web/lib/db/index.ts`) reads `process.env.DATABASE_URL` **at import time**. DB-backed runners therefore set the env *before* node starts, via the `dotenv -e .env.test --` prefix.
- Schema SQL table names are singular and some are reserved words, so always quote them: `"user"`, `"account"`, `"session"`, `"verificationToken"`, `"book"`, `"contact"`, `"checkout"`.
- The dev `DATABASE_URL` is remote Supabase — **never** point tests at it. Tests use the local Docker DB on port 5433.
- TDD note: this plan builds test *infrastructure*, so "verify" steps run the new tests/commands and confirm expected output rather than writing a test-for-the-test.

---

## Task 1: Component test infrastructure (jsdom + RTL + Vitest projects)

**Files:**
- Modify: `apps/web/vitest.config.ts`
- Create: `apps/web/vitest.setup.ts`
- Modify: `apps/web/package.json` (devDeps via install)

- [ ] **Step 1: Install component-testing deps**

```bash
npm install -D --legacy-peer-deps jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 2: Create the jsdom setup file**

`apps/web/vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest"
import { afterEach, vi } from "vitest"
import { cleanup } from "@testing-library/react"

// jsdom lacks matchMedia; next-themes (enableSystem) needs it.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
})

afterEach(() => cleanup())
```

- [ ] **Step 3: Convert `vitest.config.ts` to two projects**

Replace the entire contents of `apps/web/vitest.config.ts` with:

```ts
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "next/server": path.resolve(__dirname, "../../node_modules/next/server.js"),
    },
  },
  test: {
    globals: true,
    server: { deps: { inline: ["next-auth", "@auth/core"] } },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: [
            "__tests__/lib/**/*.test.ts",
            "__tests__/actions/**/*.test.ts",
          ],
        },
      },
      {
        extends: true,
        test: {
          name: "components",
          environment: "jsdom",
          include: ["__tests__/components/**/*.test.tsx"],
          setupFiles: ["./vitest.setup.ts"],
        },
      },
    ],
  },
})
```

- [ ] **Step 4: Verify the existing 44 tests still pass under the `unit` project**

Run: `npm test`
Expected: both projects run; `unit` shows the existing 5 files / 44 tests passing; `components` reports no test files found (not an error). Overall exit 0.

- [ ] **Step 5: Commit**

```bash
git add apps/web/vitest.config.ts apps/web/vitest.setup.ts apps/web/package.json package-lock.json
git commit -m "test: add jsdom component project to vitest config"
```

---

## Task 2: First component tests (theme toggle + contact form)

**Files:**
- Create: `apps/web/__tests__/components/theme-toggle.test.tsx`
- Create: `apps/web/__tests__/components/contact-form.test.tsx`

- [ ] **Step 1: Write the theme-toggle test**

`apps/web/__tests__/components/theme-toggle.test.tsx`:

```tsx
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ThemeProvider } from "next-themes"
import { ThemeToggle } from "@/components/theme-toggle"

function renderToggle() {
  return render(
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ThemeToggle variant="sidebar" />
    </ThemeProvider>
  )
}

describe("ThemeToggle", () => {
  it("starts on System and its label points to the next theme", async () => {
    renderToggle()
    expect(
      await screen.findByRole("button", { name: "Switch to Light theme" })
    ).toBeInTheDocument()
  })

  it("cycles System -> Light -> Dark on click", async () => {
    const user = userEvent.setup()
    renderToggle()
    const initial = await screen.findByRole("button", {
      name: "Switch to Light theme",
    })
    await user.click(initial)
    expect(
      await screen.findByRole("button", { name: "Switch to Dark theme" })
    ).toBeInTheDocument()
    await user.click(
      screen.getByRole("button", { name: "Switch to Dark theme" })
    )
    expect(
      await screen.findByRole("button", { name: "Switch to System theme" })
    ).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Write the contact-form test**

`apps/web/__tests__/components/contact-form.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { ContactForm } from "@/components/contacts/contact-form"

describe("ContactForm", () => {
  it("renders all fields and the custom submit label", () => {
    render(<ContactForm action={vi.fn()} submitLabel="Add Contact" />)
    expect(screen.getByLabelText(/Name/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Phone/)).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Add Contact" })
    ).toBeInTheDocument()
  })

  it("prefills values from defaultValues", () => {
    render(
      <ContactForm
        action={vi.fn()}
        defaultValues={{ name: "Ada", email: "ada@example.com", phone: null }}
      />
    )
    expect(screen.getByLabelText(/Name/)).toHaveValue("Ada")
    expect(screen.getByLabelText(/Email/)).toHaveValue("ada@example.com")
  })
})
```

- [ ] **Step 3: Run the component project**

Run: `npm test -- --project components`
Expected: 2 files, 4 tests, all passing.

- [ ] **Step 4: Run the full suite to confirm nothing regressed**

Run: `npm test`
Expected: unit (44) + components (4) all pass; exit 0.

- [ ] **Step 5: Commit**

```bash
git add apps/web/__tests__/components
git commit -m "test: add component tests for theme toggle and contact form"
```

---

## Task 3: Docker test DB, secure .env.test, and scripts

**Files:**
- Create: `docker-compose.test.yml` (repo root)
- Create: `apps/web/.env.test.example`
- Create: `apps/web/scripts/init-test-env.mjs`
- Modify: `apps/web/.gitignore`
- Modify: `apps/web/package.json` and root `package.json` (scripts + dotenv-cli dep)

- [ ] **Step 1: Install dotenv-cli**

```bash
npm install -D --legacy-peer-deps dotenv-cli
```

- [ ] **Step 2: Create the Docker Compose file**

`docker-compose.test.yml` (repo root):

```yaml
services:
  db-test:
    image: postgres:18
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: postgres
    ports:
      - "5433:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 2s
      timeout: 3s
      retries: 20
```

- [ ] **Step 3: Create the env example**

`apps/web/.env.test.example`:

```
# Copy to .env.test (gitignored). Local test DB from docker-compose.test.yml.
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/postgres
# Generate a value: openssl rand -base64 32
AUTH_SECRET=
```

- [ ] **Step 4: Gitignore `.env.test`**

Append to `apps/web/.gitignore` (under the existing env section):

```
.env.test
```

- [ ] **Step 5: Create the env init script**

`apps/web/scripts/init-test-env.mjs`:

```js
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { randomBytes } from "node:crypto"

const target = ".env.test"
const example = ".env.test.example"

if (existsSync(target)) {
  console.log(`${target} already exists — leaving it untouched.`)
  process.exit(0)
}

const secret = randomBytes(32).toString("base64")
const content = readFileSync(example, "utf8").replace(
  /^AUTH_SECRET=.*$/m,
  `AUTH_SECRET=${secret}`
)
writeFileSync(target, content)
console.log(`Created ${target} with a generated AUTH_SECRET.`)
```

- [ ] **Step 6: Add scripts to `apps/web/package.json`**

In the `"scripts"` object, add (keep the existing `test` / `test:watch`):

```json
"test:integration": "dotenv -e .env.test -- vitest run -c vitest.integration.config.ts",
"test:e2e": "dotenv -e .env.test -- playwright test",
"start:e2e": "dotenv -e .env.test -- next dev -p 3100",
"test:db:up": "docker compose -f ../../docker-compose.test.yml up -d --wait",
"test:db:down": "docker compose -f ../../docker-compose.test.yml down -v",
"db:push:test": "dotenv -e .env.test -- drizzle-kit push",
"test:env:init": "node scripts/init-test-env.mjs"
```

- [ ] **Step 7: Add root proxy scripts to `package.json` (repo root)**

In the root `"scripts"`, add:

```json
"test": "npm run test --workspace=apps/web",
"test:e2e": "npm run test:e2e --workspace=apps/web"
```

- [ ] **Step 8: Verify env init + DB up + schema push**

Run from `apps/web/`:
```bash
npm run test:env:init && npm run test:db:up && npm run db:push:test
```
Expected: `.env.test` created (and gitignored — confirm with `git check-ignore apps/web/.env.test` prints the path); the `db-test` container becomes healthy; `drizzle-kit push` reports the schema applied (tables created). Leave the container running for Task 4.

- [ ] **Step 9: Commit** (`.env.test` must NOT appear in the diff)

```bash
git add docker-compose.test.yml apps/web/.env.test.example apps/web/scripts/init-test-env.mjs apps/web/.gitignore apps/web/package.json package.json package-lock.json
git status   # confirm apps/web/.env.test is untracked/ignored
git commit -m "test: add docker test db, secure .env.test handling, and scripts"
```

---

## Task 4: DB-integration tests (query layer vs real Postgres)

**Files:**
- Create: `apps/web/vitest.integration.config.ts`
- Create: `apps/web/__tests__/integration/helpers.ts`
- Create: `apps/web/__tests__/integration/queries/books.test.ts`

Prerequisite: the `db-test` container is up and schema pushed (Task 3 step 8). If not: `npm run test:db:up && npm run db:push:test`.

- [ ] **Step 1: Create the integration Vitest config**

`apps/web/vitest.integration.config.ts`:

```ts
import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["__tests__/integration/**/*.test.ts"],
    fileParallelism: false,
  },
})
```

- [ ] **Step 2: Create the truncate helper**

`apps/web/__tests__/integration/helpers.ts`:

```ts
import { sql } from "drizzle-orm"
import { db } from "@/lib/db"

export { db }

export async function truncateAll() {
  await db.execute(
    sql`TRUNCATE TABLE "checkout","book","contact","session","account","verificationToken","user" RESTART IDENTITY CASCADE`
  )
}
```

- [ ] **Step 3: Write the books query integration test**

`apps/web/__tests__/integration/queries/books.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest"
import {
  createBookRecord,
  getBooksForUser,
  deleteBookRecord,
} from "@/lib/queries/books"
import { users } from "@/lib/db/schema"
import { db, truncateAll } from "../helpers"

const USER_ID = "itest-user"

beforeEach(async () => {
  await truncateAll()
  await db.insert(users).values({ id: USER_ID, email: "itest@example.com" })
})

describe("books queries", () => {
  it("creates a book and reads it back for the user", async () => {
    await createBookRecord(USER_ID, {
      title: "Dune",
      authors: "Frank Herbert",
      isbn: "9780441013593",
      description: null,
      coverUrl: null,
    })
    const books = await getBooksForUser(USER_ID)
    expect(books).toHaveLength(1)
    expect(books[0]).toMatchObject({
      title: "Dune",
      authors: "Frank Herbert",
      isbn: "9780441013593",
      isCheckedOut: false,
    })
  })

  it("deletes a book by id and user", async () => {
    await createBookRecord(USER_ID, {
      title: "Temp",
      authors: null,
      isbn: null,
      description: null,
      coverUrl: null,
    })
    const [created] = await getBooksForUser(USER_ID)
    await deleteBookRecord(created.id, USER_ID)
    expect(await getBooksForUser(USER_ID)).toHaveLength(0)
  })

  it("does not return another user's books", async () => {
    await db.insert(users).values({ id: "other", email: "other@example.com" })
    await createBookRecord("other", {
      title: "Hidden",
      authors: null,
      isbn: null,
      description: null,
      coverUrl: null,
    })
    expect(await getBooksForUser(USER_ID)).toHaveLength(0)
  })
})
```

- [ ] **Step 4: Run the integration tests**

Run from `apps/web/`: `npm run test:integration`
Expected: 1 file, 3 tests, all passing against the Docker Postgres.

- [ ] **Step 5: Confirm they are excluded from the default suite**

Run: `npm test`
Expected: only `unit` + `components` run (no DB needed); integration files are not picked up; exit 0.

- [ ] **Step 6: Commit**

```bash
git add apps/web/vitest.integration.config.ts apps/web/__tests__/integration
git commit -m "test: add db-integration tests for books query layer"
```

---

## Task 5: Playwright config, auth-seed global setup, and auth specs

**Files:**
- Create: `apps/web/playwright.config.ts`
- Create: `apps/web/e2e/global-setup.ts`
- Create: `apps/web/e2e/auth.spec.ts`
- Modify: `apps/web/.gitignore` (ignore Playwright artifacts)

Prerequisite: `db-test` up and schema pushed.

- [ ] **Step 1: Install Playwright test runner**

```bash
npm install -D --legacy-peer-deps @playwright/test
```

- [ ] **Step 2: Install the chromium browser** (may be blocked by the sandbox)

```bash
npx playwright install chromium
```
Expected: chromium downloads. **If this fails due to no network / sandbox restrictions**, note it and continue — the config and specs are still written and verified for correctness; the actual run happens in CI / on the user's machine. Do not mark the E2E run steps "passing" if the browser could not be installed; report the blocker instead.

- [ ] **Step 3: Ignore Playwright artifacts**

Append to `apps/web/.gitignore`:

```
/test-results
/playwright-report
/playwright/.auth
```

- [ ] **Step 4: Create the Playwright config**

`apps/web/playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  timeout: 30_000,
  fullyParallel: false,
  use: {
    baseURL: "http://localhost:3100",
    storageState: "playwright/.auth/user.json",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run start:e2e",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
})
```

- [ ] **Step 5: Create the global setup (seed user + session, write storageState)**

`apps/web/e2e/global-setup.ts`:

```ts
import { randomUUID } from "node:crypto"
import { mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"
import { sql } from "drizzle-orm"
import * as schema from "../lib/db/schema"

const SESSION_COOKIE = "authjs.session-token"

async function globalSetup() {
  const client = postgres(process.env.DATABASE_URL!)
  const db = drizzle(client, { schema })

  await db.execute(
    sql`TRUNCATE TABLE "checkout","book","contact","session","account","verificationToken","user" RESTART IDENTITY CASCADE`
  )

  const userId = "e2e-user"
  await db
    .insert(schema.users)
    .values({ id: userId, email: "e2e@example.com", name: "E2E User" })

  const sessionToken = randomUUID()
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  await db.insert(schema.sessions).values({ sessionToken, userId, expires })

  await client.end()

  const storageState = {
    cookies: [
      {
        name: SESSION_COOKIE,
        value: sessionToken,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        secure: false,
        sameSite: "Lax" as const,
        expires: Math.floor(expires.getTime() / 1000),
      },
    ],
    origins: [],
  }

  const out = path.join(process.cwd(), "playwright", ".auth", "user.json")
  mkdirSync(path.dirname(out), { recursive: true })
  writeFileSync(out, JSON.stringify(storageState, null, 2))
}

export default globalSetup
```

- [ ] **Step 6: Write the auth specs**

`apps/web/e2e/auth.spec.ts`:

```ts
import { test, expect } from "@playwright/test"

test("unauthenticated visitor is redirected from /books to home", async ({
  browser,
}) => {
  const context = await browser.newContext({
    storageState: { cookies: [], origins: [] },
  })
  const page = await context.newPage()
  await page.goto("/books")
  await expect(page).toHaveURL("http://localhost:3100/")
  await context.close()
})

test("seeded session can view the library", async ({ page }) => {
  await page.goto("/books")
  await expect(page).toHaveURL(/\/books$/)
  await expect(
    page.locator(".nav-desktop").getByRole("link", { name: "Books" })
  ).toBeVisible()
})
```

- [ ] **Step 7: Run the auth specs** (only if chromium installed)

Run from `apps/web/`: `npm run test:e2e -- auth.spec.ts`
Expected: 2 tests pass. The `webServer` boots `next dev` on 3100, `globalSetup` seeds the session and writes storageState. (If chromium could not be installed in Step 2, skip this run and report the blocker.)

- [ ] **Step 8: Commit**

```bash
git add apps/web/playwright.config.ts apps/web/e2e/global-setup.ts apps/web/e2e/auth.spec.ts apps/web/.gitignore apps/web/package.json package-lock.json
git commit -m "test: add playwright config, auth-seed global setup, and auth e2e specs"
```

---

## Task 6: E2E feature specs (create book + dark mode)

**Files:**
- Create: `apps/web/e2e/books.spec.ts`
- Create: `apps/web/e2e/dark-mode.spec.ts`

- [ ] **Step 1: Write the create-book spec**

`apps/web/e2e/books.spec.ts`:

```ts
import { test, expect } from "@playwright/test"

test("create a book and see it in the library list", async ({ page }) => {
  const title = `E2E Book ${Date.now()}`
  await page.goto("/books/new")
  await page.locator("#title").fill(title)
  await page.locator("#authors").fill("Test Author")
  await page.getByRole("button", { name: "Add Book" }).click()
  await expect(page).toHaveURL(/\/books$/)
  await expect(page.getByText(title)).toBeVisible()
})
```

- [ ] **Step 2: Write the dark-mode spec**

`apps/web/e2e/dark-mode.spec.ts`:

```ts
import { test, expect } from "@playwright/test"

test("theme toggle switches to dark and persists across reload", async ({
  page,
}) => {
  await page.goto("/books")
  const html = page.locator("html")
  const toggle = page
    .locator(".nav-desktop")
    .getByRole("button", { name: /Switch to .* theme/ })

  // Default is System; cycle System -> Light -> Dark.
  await toggle.click()
  await toggle.click()
  await expect(html).toHaveClass(/dark/)

  await page.reload()
  await expect(page.locator("html")).toHaveClass(/dark/)
})
```

- [ ] **Step 3: Run the feature specs** (only if chromium installed)

Run from `apps/web/`: `npm run test:e2e`
Expected: all e2e specs (auth + books + dark-mode) pass. (If chromium unavailable, report the blocker instead of a pass.)

- [ ] **Step 4: Commit**

```bash
git add apps/web/e2e/books.spec.ts apps/web/e2e/dark-mode.spec.ts
git commit -m "test: add e2e specs for book creation and dark mode"
```

---

## Task 7: CI workflow (GitHub Actions)

**Files:**
- Create: `.github/workflows/test.yml`

- [ ] **Step 1: Create the workflow**

`.github/workflows/test.yml`:

```yaml
name: Test

on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:18
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: postgres
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U postgres"
          --health-interval 2s
          --health-timeout 3s
          --health-retries 20
    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/postgres
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci --legacy-peer-deps
      - name: Create .env.test
        working-directory: apps/web
        run: |
          printf 'DATABASE_URL=%s\nAUTH_SECRET=%s\n' \
            "$DATABASE_URL" "$(openssl rand -base64 32)" > .env.test
      - name: Push schema
        working-directory: apps/web
        run: npm run db:push:test
      - name: Unit + component tests
        working-directory: apps/web
        run: npm test
      - name: Integration tests
        working-directory: apps/web
        run: npm run test:integration
      - name: Install Playwright browser
        working-directory: apps/web
        run: npx playwright install --with-deps chromium
      - name: E2E tests
        working-directory: apps/web
        run: npm run test:e2e
```

- [ ] **Step 2: Validate the YAML**

Run from repo root: `python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/test.yml')); print('yaml ok')"`
Expected: `yaml ok`. (Full execution happens on GitHub once pushed; it cannot run locally.)

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/test.yml
git commit -m "ci: run unit, component, integration, and e2e tests on PRs"
```

---

## Task 8: Final verification

- [ ] **Step 1: Mock-only suite (no Docker needed)**

Run from `apps/web/`: `npm test`
Expected: `unit` (44) + `components` (4) pass; exit 0.

- [ ] **Step 2: DB-backed suites**

Run from `apps/web/`:
```bash
npm run test:db:up && npm run db:push:test && npm run test:integration
```
Expected: integration tests pass. Then, if chromium is installed: `npm run test:e2e` — all e2e specs pass. If chromium is not installable in this environment, record that E2E is verified by config/spec correctness and deferred to CI.

- [ ] **Step 3: Confirm no secrets were committed**

Run from repo root:
```bash
git ls-files | grep -E 'apps/web/\.env\.test$' && echo "LEAK" || echo "clean (no .env.test tracked)"
```
Expected: `clean (no .env.test tracked)`.

- [ ] **Step 4: Tear down the test DB**

Run from `apps/web/`: `npm run test:db:down`
Expected: container and volume removed.

- [ ] **Step 5: Final commit (if any cleanup was needed)**

```bash
git add -A
git commit -m "test: testing stack final cleanup"
```
