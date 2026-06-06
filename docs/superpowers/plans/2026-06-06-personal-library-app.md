# Personal Library App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full personal library tracking app where a user can manage their book collection, contacts (friends/family), and track who has each book checked out.

**Architecture:** Next.js 16 App Router with server-rendered pages, Client Component forms using `useActionState`, and server functions (`'use server'`) for all mutations. Data layer is split into query functions (`lib/queries/`) that touch the DB and action functions (`lib/actions/`) that handle auth + call queries + call `revalidatePath`/`redirect`. This split makes actions fully unit-testable via mocks.

**Tech Stack:** Next.js 16.2.7, React 19, Drizzle ORM + `postgres` driver, Auth.js v5 beta (GitHub provider), Tailwind CSS v4, Vitest for unit tests.

---

## File Map

Files created or meaningfully modified in this plan, grouped by concern:

**Test infrastructure**
- Create: `apps/web/vitest.config.ts`
- Modify: `apps/web/package.json` (add `vitest`, `@vitejs/plugin-react`)

**Data layer — queries** (pure async functions; take `userId`, return data)
- Create: `apps/web/lib/queries/books.ts`
- Create: `apps/web/lib/queries/contacts.ts`
- Create: `apps/web/lib/queries/checkouts.ts`

**Data layer — server actions** (auth check → call query → revalidate/redirect)
- Create: `apps/web/lib/actions/auth.ts`
- Create: `apps/web/lib/actions/books.ts`
- Create: `apps/web/lib/actions/contacts.ts`
- Create: `apps/web/lib/actions/checkouts.ts`

**Unit tests** (mock auth + queries, test actions in isolation)
- Create: `apps/web/__tests__/actions/books.test.ts`
- Create: `apps/web/__tests__/actions/contacts.test.ts`
- Create: `apps/web/__tests__/actions/checkouts.test.ts`

**UI — shared**
- Create: `apps/web/components/nav.tsx`
- Modify: `apps/web/app/layout.tsx` (title/description)
- Modify: `apps/web/app/page.tsx` (replace Next.js placeholder with sign-in page)
- Modify: `apps/web/app/(library)/layout.tsx` (add Nav)

**UI — books**
- Create: `apps/web/components/books/book-form.tsx`
- Modify: `apps/web/app/(library)/books/page.tsx`
- Create: `apps/web/app/(library)/books/new/page.tsx`
- Create: `apps/web/app/(library)/books/[id]/page.tsx`
- Create: `apps/web/app/(library)/books/[id]/edit/page.tsx`

**UI — contacts**
- Create: `apps/web/components/contacts/contact-form.tsx`
- Modify: `apps/web/app/(library)/contacts/page.tsx`
- Create: `apps/web/app/(library)/contacts/new/page.tsx`
- Create: `apps/web/app/(library)/contacts/[id]/page.tsx`
- Create: `apps/web/app/(library)/contacts/[id]/edit/page.tsx`

**UI — checkouts**
- Create: `apps/web/components/checkouts/checkout-form.tsx`
- Modify: `apps/web/app/(library)/checkouts/page.tsx`
- Create: `apps/web/app/(library)/checkouts/new/page.tsx`

---

## Conventions Used Throughout

- **Auth check pattern in actions:** `const session = await auth(); if (!session?.user?.id) return { error: 'Unauthorized' }`
- **Action signature for `useActionState`:** `async function action(prevState: { error: string } | null, formData: FormData): Promise<{ error: string } | null>`
- **On success:** call `revalidatePath(path)` then `redirect(path)` — redirect throws a framework-handled exception so nothing after it runs
- **Drizzle imports:** `import { eq, and, isNull, desc } from 'drizzle-orm'`
- **Path alias:** `@/` resolves to `apps/web/` (configured in `tsconfig.json`)
- **Test mocking order:** always mock `@/auth`, `next/cache`, `next/navigation`, then the relevant query module

---

## Phase 1: Infrastructure

### Task 1: Vitest setup

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/vitest.config.ts`

- [ ] **Step 1: Install vitest and plugin**

```bash
cd apps/web
npm install --save-dev vitest @vitejs/plugin-react --legacy-peer-deps
```

- [ ] **Step 2: Create vitest config**

Create `apps/web/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

- [ ] **Step 3: Add test script to apps/web/package.json**

In `apps/web/package.json`, add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Create test directory and write a smoke test**

Create `apps/web/__tests__/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest'

describe('test setup', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 5: Run the test**

```bash
cd apps/web && npm test
```
Expected output: `✓ apps/web/__tests__/smoke.test.ts (1 test) — smoke.test.ts > test setup > runs`

- [ ] **Step 6: Delete smoke test and commit**

```bash
rm apps/web/__tests__/smoke.test.ts
git add apps/web/vitest.config.ts apps/web/package.json apps/web/package-lock.json
git commit -m "chore: set up vitest"
```

---

### Task 2: Push DB schema

This is an operational step, not code. The schema is already defined. These are the steps to apply it to a running PostgreSQL instance.

- [ ] **Step 1: Confirm .env.local exists with DATABASE_URL**

```bash
ls apps/web/.env.local
# If missing: cp apps/web/.env.local.example apps/web/.env.local
# Then fill in DATABASE_URL, AUTH_SECRET, AUTH_GITHUB_ID, AUTH_GITHUB_SECRET
```

- [ ] **Step 2: Push schema to DB**

```bash
npm run db:push
```
Expected: Drizzle prints each table created (`user`, `account`, `session`, `verificationToken`, `book`, `contact`, `checkout`).

- [ ] **Step 3: Verify with Drizzle Studio**

```bash
npm run db:studio
# Open http://localhost:4983 — all 7 tables should appear
```

---

## Phase 2: Auth & App Shell

### Task 3: Update root metadata and sign-in page

Replace the default Next.js scaffold landing page with a real sign-in page.

**Files:**
- Modify: `apps/web/app/layout.tsx`
- Modify: `apps/web/app/page.tsx`

- [ ] **Step 1: Update metadata in root layout**

Replace `apps/web/app/layout.tsx`:
```tsx
import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Personal Library",
  description: "Track your books and who has them",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
```

- [ ] **Step 2: Replace page.tsx with sign-in page**

Replace `apps/web/app/page.tsx`:
```tsx
import { auth, signIn } from "@/auth"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const session = await auth()
  if (session) redirect("/books")

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-50">
      <h1 className="text-3xl font-semibold text-zinc-900">Personal Library</h1>
      <p className="text-zinc-500">Track your books and who has them.</p>
      <form
        action={async () => {
          "use server"
          await signIn("github", { redirectTo: "/books" })
        }}
      >
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Sign in with GitHub
        </button>
      </form>
    </main>
  )
}
```

- [ ] **Step 3: Type-check**

```bash
cd apps/web && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/layout.tsx apps/web/app/page.tsx
git commit -m "feat: replace placeholder with sign-in page"
```

---

### Task 4: Sign-out server action

The nav will need a sign-out action. Client Components can't define inline server functions, so extract it.

**Files:**
- Create: `apps/web/lib/actions/auth.ts`

- [ ] **Step 1: Create auth actions file**

Create `apps/web/lib/actions/auth.ts`:
```ts
"use server"

import { signOut } from "@/auth"

export async function signOutAction() {
  await signOut({ redirectTo: "/" })
}
```

- [ ] **Step 2: Type-check**

```bash
cd apps/web && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/lib/actions/auth.ts
git commit -m "feat: add sign-out server action"
```

---

### Task 5: Navigation component and library layout

**Files:**
- Create: `apps/web/components/nav.tsx`
- Modify: `apps/web/app/(library)/layout.tsx`

- [ ] **Step 1: Create Nav component**

Create `apps/web/components/nav.tsx`:
```tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOutAction } from "@/lib/actions/auth"

const links = [
  { href: "/books", label: "Books" },
  { href: "/contacts", label: "Contacts" },
  { href: "/checkouts", label: "Checkouts" },
]

export function Nav() {
  const pathname = usePathname()

  return (
    <nav className="flex w-48 flex-col gap-1 border-r border-zinc-200 bg-white px-3 py-6">
      <p className="mb-4 px-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">
        Library
      </p>
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            pathname.startsWith(href)
              ? "bg-zinc-100 text-zinc-900"
              : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
          }`}
        >
          {label}
        </Link>
      ))}
      <form action={signOutAction} className="mt-auto">
        <button
          type="submit"
          className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
        >
          Sign out
        </button>
      </form>
    </nav>
  )
}
```

- [ ] **Step 2: Update library layout to include Nav**

Replace `apps/web/app/(library)/layout.tsx`:
```tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Nav } from "@/components/nav"

export default async function LibraryLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/")

  return (
    <div className="flex min-h-screen">
      <Nav />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  )
}
```

- [ ] **Step 3: Type-check**

```bash
cd apps/web && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/nav.tsx apps/web/app/(library)/layout.tsx
git commit -m "feat: add navigation sidebar and update library layout"
```

---

## Phase 3: Books

### Task 6: Book query functions

**Files:**
- Create: `apps/web/lib/queries/books.ts`

- [ ] **Step 1: Create book queries**

Create `apps/web/lib/queries/books.ts`:
```ts
import { db } from "@/lib/db"
import { books, checkouts } from "@/lib/db/schema"
import { and, desc, eq, isNull } from "drizzle-orm"

export type BookRow = typeof books.$inferSelect

export type BookWithAvailability = BookRow & { isCheckedOut: boolean }

export async function getBooksForUser(userId: string): Promise<BookWithAvailability[]> {
  const rows = await db
    .select({
      id: books.id,
      userId: books.userId,
      isbn: books.isbn,
      title: books.title,
      authors: books.authors,
      description: books.description,
      coverUrl: books.coverUrl,
      createdAt: books.createdAt,
      activeCheckoutId: checkouts.id,
    })
    .from(books)
    .leftJoin(
      checkouts,
      and(eq(checkouts.bookId, books.id), isNull(checkouts.returnedAt))
    )
    .where(eq(books.userId, userId))
    .orderBy(desc(books.createdAt))

  return rows.map(({ activeCheckoutId, ...book }) => ({
    ...book,
    isCheckedOut: activeCheckoutId !== null,
  }))
}

export async function getBookById(
  id: string,
  userId: string
): Promise<BookRow | null> {
  const rows = await db
    .select()
    .from(books)
    .where(and(eq(books.id, id), eq(books.userId, userId)))
    .limit(1)
  return rows[0] ?? null
}

export async function createBookRecord(
  userId: string,
  data: { title: string; authors: string | null; isbn: string | null; description: string | null; coverUrl: string | null }
): Promise<void> {
  await db.insert(books).values({ userId, ...data })
}

export async function updateBookRecord(
  id: string,
  userId: string,
  data: { title: string; authors: string | null; isbn: string | null; description: string | null; coverUrl: string | null }
): Promise<void> {
  await db
    .update(books)
    .set(data)
    .where(and(eq(books.id, id), eq(books.userId, userId)))
}

export async function deleteBookRecord(id: string, userId: string): Promise<void> {
  await db.delete(books).where(and(eq(books.id, id), eq(books.userId, userId)))
}
```

- [ ] **Step 2: Type-check**

```bash
cd apps/web && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/lib/queries/books.ts
git commit -m "feat: add book query functions"
```

---

### Task 7: createBook server action + test

**Files:**
- Create: `apps/web/lib/actions/books.ts`
- Create: `apps/web/__tests__/actions/books.test.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/web/__tests__/actions/books.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth")
vi.mock("@/lib/queries/books")
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/navigation", () => ({ redirect: vi.fn() }))

import { auth } from "@/auth"
import { createBookRecord } from "@/lib/queries/books"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

describe("createBook", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns error when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null)
    const { createBook } = await import("@/lib/actions/books")
    const fd = new FormData()
    fd.set("title", "Test Book")
    const result = await createBook(null, fd)
    expect(result).toEqual({ error: "Unauthorized" })
    expect(createBookRecord).not.toHaveBeenCalled()
  })

  it("returns error when title is empty", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1" }, expires: "" } as any)
    const { createBook } = await import("@/lib/actions/books")
    const fd = new FormData()
    fd.set("title", "   ")
    const result = await createBook(null, fd)
    expect(result).toEqual({ error: "Title is required" })
  })

  it("calls createBookRecord with userId and parsed fields", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1" }, expires: "" } as any)
    vi.mocked(createBookRecord).mockResolvedValue()
    const { createBook } = await import("@/lib/actions/books")
    const fd = new FormData()
    fd.set("title", "Dune")
    fd.set("authors", "Frank Herbert")
    fd.set("isbn", "9780441013593")
    const result = await createBook(null, fd)
    expect(createBookRecord).toHaveBeenCalledWith("u1", {
      title: "Dune",
      authors: "Frank Herbert",
      isbn: "9780441013593",
      description: null,
      coverUrl: null,
    })
    expect(revalidatePath).toHaveBeenCalledWith("/books")
    expect(redirect).toHaveBeenCalledWith("/books")
    expect(result).toBeNull()
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
cd apps/web && npm test -- --reporter=verbose 2>&1 | grep -A5 "createBook"
```
Expected: `FAIL — Cannot find module '@/lib/actions/books'`

- [ ] **Step 3: Create the actions file with createBook**

Create `apps/web/lib/actions/books.ts`:
```ts
"use server"

import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createBookRecord } from "@/lib/queries/books"

type ActionState = { error: string } | null

function nullIfEmpty(val: FormDataEntryValue | null): string | null {
  if (!val || String(val).trim() === "") return null
  return String(val).trim()
}

export async function createBook(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const title = nullIfEmpty(formData.get("title"))
  if (!title) return { error: "Title is required" }

  await createBookRecord(session.user.id, {
    title,
    authors: nullIfEmpty(formData.get("authors")),
    isbn: nullIfEmpty(formData.get("isbn")),
    description: nullIfEmpty(formData.get("description")),
    coverUrl: nullIfEmpty(formData.get("coverUrl")),
  })

  revalidatePath("/books")
  redirect("/books")
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
cd apps/web && npm test -- --reporter=verbose 2>&1 | grep -A5 "createBook"
```
Expected: all 3 `createBook` tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/actions/books.ts apps/web/__tests__/actions/books.test.ts
git commit -m "feat: add createBook server action with tests"
```

---

### Task 8: deleteBook server action + test

**Files:**
- Modify: `apps/web/lib/actions/books.ts`
- Modify: `apps/web/__tests__/actions/books.test.ts`

- [ ] **Step 1: Add failing tests for deleteBook**

Append to `apps/web/__tests__/actions/books.test.ts`:
```ts
describe("deleteBook", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns error when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null)
    const { deleteBook } = await import("@/lib/actions/books")
    const fd = new FormData()
    fd.set("id", "book1")
    const result = await deleteBook(null, fd)
    expect(result).toEqual({ error: "Unauthorized" })
  })

  it("calls deleteBookRecord with id and userId and redirects", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1" }, expires: "" } as any)
    const { deleteBookRecord } = await import("@/lib/queries/books")
    vi.mocked(deleteBookRecord).mockResolvedValue()
    const { deleteBook } = await import("@/lib/actions/books")
    const fd = new FormData()
    fd.set("id", "book1")
    await deleteBook(null, fd)
    expect(deleteBookRecord).toHaveBeenCalledWith("book1", "u1")
    expect(revalidatePath).toHaveBeenCalledWith("/books")
    expect(redirect).toHaveBeenCalledWith("/books")
  })
})
```

- [ ] **Step 2: Run test — verify new tests fail**

```bash
cd apps/web && npm test 2>&1 | tail -5
```
Expected: `deleteBook` tests fail with "not a function".

- [ ] **Step 3: Add deleteBook to actions file**

Append to `apps/web/lib/actions/books.ts`:
```ts
import { deleteBookRecord } from "@/lib/queries/books"

export async function deleteBook(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const id = String(formData.get("id") ?? "")
  await deleteBookRecord(id, session.user.id)

  revalidatePath("/books")
  redirect("/books")
}
```

> Note: The `deleteBookRecord` import must be added to the existing imports at the top of the file alongside `createBookRecord`.

Full updated imports section of `apps/web/lib/actions/books.ts`:
```ts
import { createBookRecord, deleteBookRecord, updateBookRecord } from "@/lib/queries/books"
```

- [ ] **Step 4: Run test — verify all pass**

```bash
cd apps/web && npm test
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/actions/books.ts apps/web/__tests__/actions/books.test.ts
git commit -m "feat: add deleteBook server action with tests"
```

---

### Task 9: updateBook server action + test

**Files:**
- Modify: `apps/web/lib/actions/books.ts`
- Modify: `apps/web/__tests__/actions/books.test.ts`

- [ ] **Step 1: Add failing tests for updateBook**

Append to `apps/web/__tests__/actions/books.test.ts`:
```ts
describe("updateBook", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns error when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null)
    const { updateBook } = await import("@/lib/actions/books")
    const fd = new FormData()
    fd.set("id", "book1")
    fd.set("title", "New Title")
    const result = await updateBook(null, fd)
    expect(result).toEqual({ error: "Unauthorized" })
  })

  it("returns error when title is empty", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1" }, expires: "" } as any)
    const { updateBook } = await import("@/lib/actions/books")
    const fd = new FormData()
    fd.set("id", "book1")
    fd.set("title", "")
    const result = await updateBook(null, fd)
    expect(result).toEqual({ error: "Title is required" })
  })

  it("calls updateBookRecord and redirects to book detail", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1" }, expires: "" } as any)
    const { updateBookRecord } = await import("@/lib/queries/books")
    vi.mocked(updateBookRecord).mockResolvedValue()
    const { updateBook } = await import("@/lib/actions/books")
    const fd = new FormData()
    fd.set("id", "book1")
    fd.set("title", "Updated Title")
    fd.set("authors", "Author")
    await updateBook(null, fd)
    expect(updateBookRecord).toHaveBeenCalledWith("book1", "u1", {
      title: "Updated Title",
      authors: "Author",
      isbn: null,
      description: null,
      coverUrl: null,
    })
    expect(redirect).toHaveBeenCalledWith("/books/book1")
  })
})
```

- [ ] **Step 2: Run test — verify new tests fail**

```bash
cd apps/web && npm test 2>&1 | tail -5
```

- [ ] **Step 3: Add updateBook to actions file**

Append to `apps/web/lib/actions/books.ts`:
```ts
export async function updateBook(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const id = String(formData.get("id") ?? "")
  const title = nullIfEmpty(formData.get("title"))
  if (!title) return { error: "Title is required" }

  await updateBookRecord(id, session.user.id, {
    title,
    authors: nullIfEmpty(formData.get("authors")),
    isbn: nullIfEmpty(formData.get("isbn")),
    description: nullIfEmpty(formData.get("description")),
    coverUrl: nullIfEmpty(formData.get("coverUrl")),
  })

  revalidatePath(`/books/${id}`)
  redirect(`/books/${id}`)
}
```

- [ ] **Step 4: Run test — verify all pass**

```bash
cd apps/web && npm test
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/actions/books.ts apps/web/__tests__/actions/books.test.ts
git commit -m "feat: add updateBook server action with tests"
```

---

### Task 10: Books list page

**Files:**
- Modify: `apps/web/app/(library)/books/page.tsx`

- [ ] **Step 1: Replace stub with real page**

Replace `apps/web/app/(library)/books/page.tsx`:
```tsx
import Link from "next/link"
import { auth } from "@/auth"
import { getBooksForUser } from "@/lib/queries/books"

export default async function BooksPage() {
  const session = await auth()
  const books = await getBooksForUser(session!.user!.id!)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">My Library</h1>
        <Link
          href="/books/new"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Add Book
        </Link>
      </div>

      {books.length === 0 ? (
        <p className="text-zinc-500">No books yet. Add your first book to get started.</p>
      ) : (
        <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
          {books.map((book) => (
            <li key={book.id}>
              <Link
                href={`/books/${book.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-zinc-50"
              >
                <div>
                  <p className="font-medium text-zinc-900">{book.title}</p>
                  {book.authors && (
                    <p className="text-sm text-zinc-500">{book.authors}</p>
                  )}
                </div>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    book.isCheckedOut
                      ? "bg-amber-100 text-amber-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {book.isCheckedOut ? "Checked out" : "Available"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
cd apps/web && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/(library)/books/page.tsx
git commit -m "feat: books list page with availability status"
```

---

### Task 11: Add Book form and page

**Files:**
- Create: `apps/web/components/books/book-form.tsx`
- Create: `apps/web/app/(library)/books/new/page.tsx`

- [ ] **Step 1: Create BookForm client component**

Create `apps/web/components/books/book-form.tsx`:
```tsx
"use client"

import { useActionState } from "react"

type ActionState = { error: string } | null
type BookFormAction = (
  prevState: ActionState,
  formData: FormData
) => Promise<ActionState>

interface BookFormProps {
  action: BookFormAction
  defaultValues?: {
    id?: string
    title?: string
    authors?: string | null
    isbn?: string | null
    description?: string | null
    coverUrl?: string | null
  }
  submitLabel?: string
}

export function BookForm({ action, defaultValues, submitLabel = "Save" }: BookFormProps) {
  const [state, formAction, isPending] = useActionState(action, null)

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-lg">
      {state && "error" in state && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      {defaultValues?.id && (
        <input type="hidden" name="id" value={defaultValues.id} />
      )}

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700" htmlFor="title">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={defaultValues?.title ?? ""}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700" htmlFor="authors">
          Author(s)
        </label>
        <input
          id="authors"
          name="authors"
          defaultValue={defaultValues?.authors ?? ""}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700" htmlFor="isbn">
          ISBN
        </label>
        <input
          id="isbn"
          name="isbn"
          defaultValue={defaultValues?.isbn ?? ""}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={defaultValues?.description ?? ""}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700" htmlFor="coverUrl">
          Cover image URL
        </label>
        <input
          id="coverUrl"
          name="coverUrl"
          type="url"
          defaultValue={defaultValues?.coverUrl ?? ""}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
      >
        {isPending ? "Saving…" : submitLabel}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Create /books/new page**

Create `apps/web/app/(library)/books/new/page.tsx`:
```tsx
import Link from "next/link"
import { BookForm } from "@/components/books/book-form"
import { createBook } from "@/lib/actions/books"

export default function NewBookPage() {
  return (
    <div>
      <div className="mb-6">
        <Link href="/books" className="text-sm text-zinc-500 hover:text-zinc-700">
          ← Back to library
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Add a Book</h1>
      </div>
      <BookForm action={createBook} submitLabel="Add Book" />
    </div>
  )
}
```

- [ ] **Step 3: Type-check**

```bash
cd apps/web && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/books/book-form.tsx apps/web/app/(library)/books/new/page.tsx
git commit -m "feat: add book form component and /books/new page"
```

---

### Task 12: Book detail page

**Files:**
- Create: `apps/web/app/(library)/books/[id]/page.tsx`

- [ ] **Step 1: Create book detail page**

Create `apps/web/app/(library)/books/[id]/page.tsx`:
```tsx
import Link from "next/link"
import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { getBookById } from "@/lib/queries/books"
import { deleteBook } from "@/lib/actions/books"

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  const book = await getBookById(id, session!.user!.id!)
  if (!book) notFound()

  return (
    <div>
      <div className="mb-6">
        <Link href="/books" className="text-sm text-zinc-500 hover:text-zinc-700">
          ← Back to library
        </Link>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">{book.title}</h1>
            {book.authors && <p className="mt-1 text-zinc-500">{book.authors}</p>}
            {book.isbn && (
              <p className="mt-1 text-xs text-zinc-400">ISBN: {book.isbn}</p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Link
              href={`/books/${book.id}/edit`}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Edit
            </Link>
            <form action={deleteBook}>
              <input type="hidden" name="id" value={book.id} />
              <button
                type="submit"
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
                onClick={(e) => {
                  if (!confirm("Delete this book? This cannot be undone.")) e.preventDefault()
                }}
              >
                Delete
              </button>
            </form>
          </div>
        </div>

        {book.description && (
          <p className="text-sm leading-relaxed text-zinc-600">{book.description}</p>
        )}
        {book.coverUrl && (
          <img
            src={book.coverUrl}
            alt={`Cover of ${book.title}`}
            className="mt-4 h-48 w-auto rounded-lg object-cover"
          />
        )}
      </div>
    </div>
  )
}
```

> **Note on `params`:** In Next.js 15+, dynamic route `params` is a Promise that must be awaited. The type `Promise<{ id: string }>` reflects this.

- [ ] **Step 2: Type-check**

```bash
cd apps/web && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add "apps/web/app/(library)/books/[id]/page.tsx"
git commit -m "feat: book detail page with delete action"
```

---

### Task 13: Edit book page

**Files:**
- Create: `apps/web/app/(library)/books/[id]/edit/page.tsx`

- [ ] **Step 1: Create edit book page**

Create `apps/web/app/(library)/books/[id]/edit/page.tsx`:
```tsx
import Link from "next/link"
import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { getBookById } from "@/lib/queries/books"
import { updateBook } from "@/lib/actions/books"
import { BookForm } from "@/components/books/book-form"

export default async function EditBookPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  const book = await getBookById(id, session!.user!.id!)
  if (!book) notFound()

  return (
    <div>
      <div className="mb-6">
        <Link href={`/books/${id}`} className="text-sm text-zinc-500 hover:text-zinc-700">
          ← Back to book
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Edit Book</h1>
      </div>
      <BookForm
        action={updateBook}
        defaultValues={book}
        submitLabel="Save Changes"
      />
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
cd apps/web && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add "apps/web/app/(library)/books/[id]/edit/page.tsx"
git commit -m "feat: edit book page"
```

---

## Phase 4: Contacts

### Task 14: Contact query functions

**Files:**
- Create: `apps/web/lib/queries/contacts.ts`

- [ ] **Step 1: Create contact queries**

Create `apps/web/lib/queries/contacts.ts`:
```ts
import { db } from "@/lib/db"
import { contacts } from "@/lib/db/schema"
import { and, asc, eq } from "drizzle-orm"

export type ContactRow = typeof contacts.$inferSelect

export async function getContactsForUser(userId: string): Promise<ContactRow[]> {
  return db
    .select()
    .from(contacts)
    .where(eq(contacts.userId, userId))
    .orderBy(asc(contacts.name))
}

export async function getContactById(
  id: string,
  userId: string
): Promise<ContactRow | null> {
  const rows = await db
    .select()
    .from(contacts)
    .where(and(eq(contacts.id, id), eq(contacts.userId, userId)))
    .limit(1)
  return rows[0] ?? null
}

export async function createContactRecord(
  userId: string,
  data: { name: string; email: string | null; phone: string | null }
): Promise<void> {
  await db.insert(contacts).values({ userId, ...data })
}

export async function updateContactRecord(
  id: string,
  userId: string,
  data: { name: string; email: string | null; phone: string | null }
): Promise<void> {
  await db
    .update(contacts)
    .set(data)
    .where(and(eq(contacts.id, id), eq(contacts.userId, userId)))
}

export async function deleteContactRecord(id: string, userId: string): Promise<void> {
  await db.delete(contacts).where(and(eq(contacts.id, id), eq(contacts.userId, userId)))
}
```

- [ ] **Step 2: Type-check**

```bash
cd apps/web && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/lib/queries/contacts.ts
git commit -m "feat: add contact query functions"
```

---

### Task 15: Contact server actions + tests

**Files:**
- Create: `apps/web/lib/actions/contacts.ts`
- Create: `apps/web/__tests__/actions/contacts.test.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/web/__tests__/actions/contacts.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth")
vi.mock("@/lib/queries/contacts")
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/navigation", () => ({ redirect: vi.fn() }))

import { auth } from "@/auth"
import { createContactRecord, deleteContactRecord, updateContactRecord } from "@/lib/queries/contacts"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

describe("createContact", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns error when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null)
    const { createContact } = await import("@/lib/actions/contacts")
    const fd = new FormData()
    fd.set("name", "Alice")
    const result = await createContact(null, fd)
    expect(result).toEqual({ error: "Unauthorized" })
  })

  it("returns error when name is empty", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1" }, expires: "" } as any)
    const { createContact } = await import("@/lib/actions/contacts")
    const fd = new FormData()
    fd.set("name", "")
    const result = await createContact(null, fd)
    expect(result).toEqual({ error: "Name is required" })
  })

  it("creates contact and redirects", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1" }, expires: "" } as any)
    vi.mocked(createContactRecord).mockResolvedValue()
    const { createContact } = await import("@/lib/actions/contacts")
    const fd = new FormData()
    fd.set("name", "Alice")
    fd.set("email", "alice@example.com")
    await createContact(null, fd)
    expect(createContactRecord).toHaveBeenCalledWith("u1", {
      name: "Alice",
      email: "alice@example.com",
      phone: null,
    })
    expect(revalidatePath).toHaveBeenCalledWith("/contacts")
    expect(redirect).toHaveBeenCalledWith("/contacts")
  })
})

describe("deleteContact", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns error when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null)
    const { deleteContact } = await import("@/lib/actions/contacts")
    const fd = new FormData()
    fd.set("id", "c1")
    expect(await deleteContact(null, fd)).toEqual({ error: "Unauthorized" })
  })

  it("deletes and redirects", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1" }, expires: "" } as any)
    vi.mocked(deleteContactRecord).mockResolvedValue()
    const { deleteContact } = await import("@/lib/actions/contacts")
    const fd = new FormData()
    fd.set("id", "c1")
    await deleteContact(null, fd)
    expect(deleteContactRecord).toHaveBeenCalledWith("c1", "u1")
    expect(redirect).toHaveBeenCalledWith("/contacts")
  })
})

describe("updateContact", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns error when name is empty", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1" }, expires: "" } as any)
    const { updateContact } = await import("@/lib/actions/contacts")
    const fd = new FormData()
    fd.set("id", "c1")
    fd.set("name", "")
    expect(await updateContact(null, fd)).toEqual({ error: "Name is required" })
  })

  it("updates and redirects to contact detail", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1" }, expires: "" } as any)
    vi.mocked(updateContactRecord).mockResolvedValue()
    const { updateContact } = await import("@/lib/actions/contacts")
    const fd = new FormData()
    fd.set("id", "c1")
    fd.set("name", "Bob")
    await updateContact(null, fd)
    expect(updateContactRecord).toHaveBeenCalledWith("c1", "u1", {
      name: "Bob",
      email: null,
      phone: null,
    })
    expect(redirect).toHaveBeenCalledWith("/contacts/c1")
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd apps/web && npm test 2>&1 | tail -5
```

- [ ] **Step 3: Create contact actions**

Create `apps/web/lib/actions/contacts.ts`:
```ts
"use server"

import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import {
  createContactRecord,
  deleteContactRecord,
  updateContactRecord,
} from "@/lib/queries/contacts"

type ActionState = { error: string } | null

function nullIfEmpty(val: FormDataEntryValue | null): string | null {
  if (!val || String(val).trim() === "") return null
  return String(val).trim()
}

export async function createContact(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const name = nullIfEmpty(formData.get("name"))
  if (!name) return { error: "Name is required" }

  await createContactRecord(session.user.id, {
    name,
    email: nullIfEmpty(formData.get("email")),
    phone: nullIfEmpty(formData.get("phone")),
  })

  revalidatePath("/contacts")
  redirect("/contacts")
}

export async function deleteContact(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const id = String(formData.get("id") ?? "")
  await deleteContactRecord(id, session.user.id)

  revalidatePath("/contacts")
  redirect("/contacts")
}

export async function updateContact(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const id = String(formData.get("id") ?? "")
  const name = nullIfEmpty(formData.get("name"))
  if (!name) return { error: "Name is required" }

  await updateContactRecord(id, session.user.id, {
    name,
    email: nullIfEmpty(formData.get("email")),
    phone: nullIfEmpty(formData.get("phone")),
  })

  revalidatePath(`/contacts/${id}`)
  redirect(`/contacts/${id}`)
}
```

- [ ] **Step 4: Run tests — verify all pass**

```bash
cd apps/web && npm test
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/actions/contacts.ts apps/web/__tests__/actions/contacts.test.ts
git commit -m "feat: add contact server actions with tests"
```

---

### Task 16: Contact form component

**Files:**
- Create: `apps/web/components/contacts/contact-form.tsx`

- [ ] **Step 1: Create ContactForm**

Create `apps/web/components/contacts/contact-form.tsx`:
```tsx
"use client"

import { useActionState } from "react"

type ActionState = { error: string } | null
type ContactFormAction = (
  prevState: ActionState,
  formData: FormData
) => Promise<ActionState>

interface ContactFormProps {
  action: ContactFormAction
  defaultValues?: {
    id?: string
    name?: string
    email?: string | null
    phone?: string | null
  }
  submitLabel?: string
}

export function ContactForm({
  action,
  defaultValues,
  submitLabel = "Save",
}: ContactFormProps) {
  const [state, formAction, isPending] = useActionState(action, null)

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-md">
      {state && "error" in state && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      {defaultValues?.id && (
        <input type="hidden" name="id" value={defaultValues.id} />
      )}

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700" htmlFor="name">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={defaultValues?.name ?? ""}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={defaultValues?.email ?? ""}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700" htmlFor="phone">
          Phone
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={defaultValues?.phone ?? ""}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
      >
        {isPending ? "Saving…" : submitLabel}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
cd apps/web && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/contacts/contact-form.tsx
git commit -m "feat: contact form component"
```

---

### Task 17: Contacts pages

**Files:**
- Modify: `apps/web/app/(library)/contacts/page.tsx`
- Create: `apps/web/app/(library)/contacts/new/page.tsx`
- Create: `apps/web/app/(library)/contacts/[id]/page.tsx`
- Create: `apps/web/app/(library)/contacts/[id]/edit/page.tsx`

- [ ] **Step 1: Contacts list page**

Replace `apps/web/app/(library)/contacts/page.tsx`:
```tsx
import Link from "next/link"
import { auth } from "@/auth"
import { getContactsForUser } from "@/lib/queries/contacts"

export default async function ContactsPage() {
  const session = await auth()
  const contacts = await getContactsForUser(session!.user!.id!)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Contacts</h1>
        <Link
          href="/contacts/new"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Add Contact
        </Link>
      </div>

      {contacts.length === 0 ? (
        <p className="text-zinc-500">No contacts yet. Add the people you lend books to.</p>
      ) : (
        <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
          {contacts.map((contact) => (
            <li key={contact.id}>
              <Link
                href={`/contacts/${contact.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-zinc-50"
              >
                <div>
                  <p className="font-medium text-zinc-900">{contact.name}</p>
                  {contact.email && (
                    <p className="text-sm text-zinc-500">{contact.email}</p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 2: New contact page**

Create `apps/web/app/(library)/contacts/new/page.tsx`:
```tsx
import Link from "next/link"
import { ContactForm } from "@/components/contacts/contact-form"
import { createContact } from "@/lib/actions/contacts"

export default function NewContactPage() {
  return (
    <div>
      <div className="mb-6">
        <Link href="/contacts" className="text-sm text-zinc-500 hover:text-zinc-700">
          ← Back to contacts
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Add a Contact</h1>
      </div>
      <ContactForm action={createContact} submitLabel="Add Contact" />
    </div>
  )
}
```

- [ ] **Step 3: Contact detail page**

Create `apps/web/app/(library)/contacts/[id]/page.tsx`:
```tsx
import Link from "next/link"
import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { getContactById } from "@/lib/queries/contacts"
import { deleteContact } from "@/lib/actions/contacts"

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  const contact = await getContactById(id, session!.user!.id!)
  if (!contact) notFound()

  return (
    <div>
      <div className="mb-6">
        <Link href="/contacts" className="text-sm text-zinc-500 hover:text-zinc-700">
          ← Back to contacts
        </Link>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">{contact.name}</h1>
            {contact.email && (
              <p className="mt-1 text-sm text-zinc-500">{contact.email}</p>
            )}
            {contact.phone && (
              <p className="mt-1 text-sm text-zinc-500">{contact.phone}</p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Link
              href={`/contacts/${contact.id}/edit`}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Edit
            </Link>
            <form action={deleteContact}>
              <input type="hidden" name="id" value={contact.id} />
              <button
                type="submit"
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
                onClick={(e) => {
                  if (!confirm("Delete this contact?")) e.preventDefault()
                }}
              >
                Delete
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Edit contact page**

Create `apps/web/app/(library)/contacts/[id]/edit/page.tsx`:
```tsx
import Link from "next/link"
import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { getContactById } from "@/lib/queries/contacts"
import { updateContact } from "@/lib/actions/contacts"
import { ContactForm } from "@/components/contacts/contact-form"

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  const contact = await getContactById(id, session!.user!.id!)
  if (!contact) notFound()

  return (
    <div>
      <div className="mb-6">
        <Link href={`/contacts/${id}`} className="text-sm text-zinc-500 hover:text-zinc-700">
          ← Back to contact
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Edit Contact</h1>
      </div>
      <ContactForm
        action={updateContact}
        defaultValues={contact}
        submitLabel="Save Changes"
      />
    </div>
  )
}
```

- [ ] **Step 5: Type-check**

```bash
cd apps/web && npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add \
  "apps/web/app/(library)/contacts/page.tsx" \
  "apps/web/app/(library)/contacts/new/page.tsx" \
  "apps/web/app/(library)/contacts/[id]/page.tsx" \
  "apps/web/app/(library)/contacts/[id]/edit/page.tsx"
git commit -m "feat: contacts list, detail, new, and edit pages"
```

---

## Phase 5: Checkouts

### Task 18: Checkout query functions

**Files:**
- Create: `apps/web/lib/queries/checkouts.ts`

- [ ] **Step 1: Create checkout queries**

Create `apps/web/lib/queries/checkouts.ts`:
```ts
import { db } from "@/lib/db"
import { books, checkouts, contacts } from "@/lib/db/schema"
import { and, desc, eq, isNull, isNotNull } from "drizzle-orm"

export type ActiveCheckout = {
  id: string
  checkedOutAt: Date
  dueDate: Date | null
  notes: string | null
  book: { id: string; title: string; authors: string | null; coverUrl: string | null }
  contact: { id: string; name: string } | null
}

export type CheckoutHistory = ActiveCheckout & { returnedAt: Date }

export async function getActiveCheckouts(userId: string): Promise<ActiveCheckout[]> {
  const rows = await db
    .select({
      id: checkouts.id,
      checkedOutAt: checkouts.checkedOutAt,
      dueDate: checkouts.dueDate,
      notes: checkouts.notes,
      bookId: books.id,
      bookTitle: books.title,
      bookAuthors: books.authors,
      bookCoverUrl: books.coverUrl,
      contactId: contacts.id,
      contactName: contacts.name,
    })
    .from(checkouts)
    .innerJoin(books, eq(checkouts.bookId, books.id))
    .leftJoin(contacts, eq(checkouts.contactId, contacts.id))
    .where(and(eq(checkouts.userId, userId), isNull(checkouts.returnedAt)))
    .orderBy(desc(checkouts.checkedOutAt))

  return rows.map((r) => ({
    id: r.id,
    checkedOutAt: r.checkedOutAt,
    dueDate: r.dueDate,
    notes: r.notes,
    book: { id: r.bookId, title: r.bookTitle, authors: r.bookAuthors, coverUrl: r.bookCoverUrl },
    contact: r.contactId ? { id: r.contactId, name: r.contactName! } : null,
  }))
}

export async function getCheckoutHistory(userId: string): Promise<CheckoutHistory[]> {
  const rows = await db
    .select({
      id: checkouts.id,
      checkedOutAt: checkouts.checkedOutAt,
      returnedAt: checkouts.returnedAt,
      dueDate: checkouts.dueDate,
      notes: checkouts.notes,
      bookId: books.id,
      bookTitle: books.title,
      bookAuthors: books.authors,
      bookCoverUrl: books.coverUrl,
      contactId: contacts.id,
      contactName: contacts.name,
    })
    .from(checkouts)
    .innerJoin(books, eq(checkouts.bookId, books.id))
    .leftJoin(contacts, eq(checkouts.contactId, contacts.id))
    .where(and(eq(checkouts.userId, userId), isNotNull(checkouts.returnedAt)))
    .orderBy(desc(checkouts.returnedAt))

  return rows.map((r) => ({
    id: r.id,
    checkedOutAt: r.checkedOutAt,
    returnedAt: r.returnedAt!,
    dueDate: r.dueDate,
    notes: r.notes,
    book: { id: r.bookId, title: r.bookTitle, authors: r.bookAuthors, coverUrl: r.bookCoverUrl },
    contact: r.contactId ? { id: r.contactId, name: r.contactName! } : null,
  }))
}

export async function createCheckoutRecord(
  userId: string,
  data: { bookId: string; contactId: string | null; dueDate: Date | null; notes: string | null }
): Promise<void> {
  await db.insert(checkouts).values({ userId, ...data })
}

export async function returnBookRecord(checkoutId: string, userId: string): Promise<void> {
  await db
    .update(checkouts)
    .set({ returnedAt: new Date() })
    .where(and(eq(checkouts.id, checkoutId), eq(checkouts.userId, userId)))
}
```

- [ ] **Step 2: Type-check**

```bash
cd apps/web && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/lib/queries/checkouts.ts
git commit -m "feat: add checkout query functions"
```

---

### Task 19: Checkout server actions + tests

**Files:**
- Create: `apps/web/lib/actions/checkouts.ts`
- Create: `apps/web/__tests__/actions/checkouts.test.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/web/__tests__/actions/checkouts.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth")
vi.mock("@/lib/queries/checkouts")
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/navigation", () => ({ redirect: vi.fn() }))

import { auth } from "@/auth"
import { createCheckoutRecord, returnBookRecord } from "@/lib/queries/checkouts"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

describe("createCheckout", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns error when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null)
    const { createCheckout } = await import("@/lib/actions/checkouts")
    const fd = new FormData()
    fd.set("bookId", "b1")
    expect(await createCheckout(null, fd)).toEqual({ error: "Unauthorized" })
  })

  it("returns error when bookId is missing", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1" }, expires: "" } as any)
    const { createCheckout } = await import("@/lib/actions/checkouts")
    const fd = new FormData()
    expect(await createCheckout(null, fd)).toEqual({ error: "Book is required" })
  })

  it("creates checkout with contactId null when borrower is self", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1" }, expires: "" } as any)
    vi.mocked(createCheckoutRecord).mockResolvedValue()
    const { createCheckout } = await import("@/lib/actions/checkouts")
    const fd = new FormData()
    fd.set("bookId", "b1")
    fd.set("borrower", "self")
    await createCheckout(null, fd)
    expect(createCheckoutRecord).toHaveBeenCalledWith("u1", {
      bookId: "b1",
      contactId: null,
      dueDate: null,
      notes: null,
    })
    expect(revalidatePath).toHaveBeenCalledWith("/checkouts")
    expect(redirect).toHaveBeenCalledWith("/checkouts")
  })

  it("creates checkout with contactId when borrower is a contact", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1" }, expires: "" } as any)
    vi.mocked(createCheckoutRecord).mockResolvedValue()
    const { createCheckout } = await import("@/lib/actions/checkouts")
    const fd = new FormData()
    fd.set("bookId", "b1")
    fd.set("borrower", "contact:c1")
    fd.set("dueDate", "2026-07-01")
    fd.set("notes", "Handle with care")
    await createCheckout(null, fd)
    expect(createCheckoutRecord).toHaveBeenCalledWith("u1", {
      bookId: "b1",
      contactId: "c1",
      dueDate: new Date("2026-07-01"),
      notes: "Handle with care",
    })
  })
})

describe("returnBook", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns error when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null)
    const { returnBook } = await import("@/lib/actions/checkouts")
    const fd = new FormData()
    fd.set("checkoutId", "co1")
    expect(await returnBook(null, fd)).toEqual({ error: "Unauthorized" })
  })

  it("calls returnBookRecord and redirects", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1" }, expires: "" } as any)
    vi.mocked(returnBookRecord).mockResolvedValue()
    const { returnBook } = await import("@/lib/actions/checkouts")
    const fd = new FormData()
    fd.set("checkoutId", "co1")
    await returnBook(null, fd)
    expect(returnBookRecord).toHaveBeenCalledWith("co1", "u1")
    expect(revalidatePath).toHaveBeenCalledWith("/checkouts")
    expect(redirect).toHaveBeenCalledWith("/checkouts")
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd apps/web && npm test 2>&1 | tail -5
```

- [ ] **Step 3: Create checkout actions**

Create `apps/web/lib/actions/checkouts.ts`:
```ts
"use server"

import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createCheckoutRecord, returnBookRecord } from "@/lib/queries/checkouts"

type ActionState = { error: string } | null

function nullIfEmpty(val: FormDataEntryValue | null): string | null {
  if (!val || String(val).trim() === "") return null
  return String(val).trim()
}

export async function createCheckout(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const bookId = nullIfEmpty(formData.get("bookId"))
  if (!bookId) return { error: "Book is required" }

  // borrower is either "self" or "contact:<contactId>"
  const borrower = String(formData.get("borrower") ?? "self")
  const contactId = borrower.startsWith("contact:") ? borrower.slice(8) : null

  const dueDateStr = nullIfEmpty(formData.get("dueDate"))
  const dueDate = dueDateStr ? new Date(dueDateStr) : null

  await createCheckoutRecord(session.user.id, {
    bookId,
    contactId,
    dueDate,
    notes: nullIfEmpty(formData.get("notes")),
  })

  revalidatePath("/checkouts")
  redirect("/checkouts")
}

export async function returnBook(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const checkoutId = String(formData.get("checkoutId") ?? "")
  await returnBookRecord(checkoutId, session.user.id)

  revalidatePath("/checkouts")
  redirect("/checkouts")
}
```

- [ ] **Step 4: Run tests — verify all pass**

```bash
cd apps/web && npm test
```
Expected: all tests pass (including previously written book and contact tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/actions/checkouts.ts apps/web/__tests__/actions/checkouts.test.ts
git commit -m "feat: add checkout server actions with tests"
```

---

### Task 20: Checkouts list page

**Files:**
- Modify: `apps/web/app/(library)/checkouts/page.tsx`

- [ ] **Step 1: Replace stub with real page**

Replace `apps/web/app/(library)/checkouts/page.tsx`:
```tsx
import Link from "next/link"
import { auth } from "@/auth"
import { getActiveCheckouts } from "@/lib/queries/checkouts"
import { returnBook } from "@/lib/actions/checkouts"

function formatDate(d: Date | null) {
  if (!d) return null
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(d)
}

export default async function CheckoutsPage() {
  const session = await auth()
  const active = await getActiveCheckouts(session!.user!.id!)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Active Checkouts</h1>
        <Link
          href="/checkouts/new"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Check Out a Book
        </Link>
      </div>

      {active.length === 0 ? (
        <p className="text-zinc-500">No books are currently checked out.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {active.map((checkout) => (
            <li
              key={checkout.id}
              className="rounded-xl border border-zinc-200 bg-white px-5 py-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-zinc-900">{checkout.book.title}</p>
                  {checkout.book.authors && (
                    <p className="text-sm text-zinc-500">{checkout.book.authors}</p>
                  )}
                  <p className="mt-1 text-sm text-zinc-600">
                    {checkout.contact
                      ? `Checked out to ${checkout.contact.name}`
                      : "Checked out to yourself"}
                  </p>
                  <p className="text-xs text-zinc-400">
                    Since {formatDate(checkout.checkedOutAt)}
                    {checkout.dueDate && ` · Due ${formatDate(checkout.dueDate)}`}
                  </p>
                  {checkout.notes && (
                    <p className="mt-1 text-xs text-zinc-500 italic">{checkout.notes}</p>
                  )}
                </div>
                <form action={returnBook} className="shrink-0">
                  <input type="hidden" name="checkoutId" value={checkout.id} />
                  <button
                    type="submit"
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    Mark Returned
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
cd apps/web && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add "apps/web/app/(library)/checkouts/page.tsx"
git commit -m "feat: active checkouts page with return action"
```

---

### Task 21: Checkout form and new page

**Files:**
- Create: `apps/web/components/checkouts/checkout-form.tsx`
- Create: `apps/web/app/(library)/checkouts/new/page.tsx`

- [ ] **Step 1: Create CheckoutForm client component**

Create `apps/web/components/checkouts/checkout-form.tsx`:
```tsx
"use client"

import { useActionState } from "react"
import type { BookRow } from "@/lib/queries/books"
import type { ContactRow } from "@/lib/queries/contacts"

type ActionState = { error: string } | null
type CheckoutFormAction = (
  prevState: ActionState,
  formData: FormData
) => Promise<ActionState>

interface CheckoutFormProps {
  action: CheckoutFormAction
  books: Pick<BookRow, "id" | "title">[]
  contacts: Pick<ContactRow, "id" | "name">[]
}

export function CheckoutForm({ action, books, contacts }: CheckoutFormProps) {
  const [state, formAction, isPending] = useActionState(action, null)

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-md">
      {state && "error" in state && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700" htmlFor="bookId">
          Book <span className="text-red-500">*</span>
        </label>
        <select
          id="bookId"
          name="bookId"
          required
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
        >
          <option value="">Select a book…</option>
          {books.map((b) => (
            <option key={b.id} value={b.id}>
              {b.title}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700" htmlFor="borrower">
          Borrower <span className="text-red-500">*</span>
        </label>
        <select
          id="borrower"
          name="borrower"
          required
          defaultValue="self"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
        >
          <option value="self">Myself</option>
          {contacts.map((c) => (
            <option key={c.id} value={`contact:${c.id}`}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700" htmlFor="dueDate">
          Due date
        </label>
        <input
          id="dueDate"
          name="dueDate"
          type="date"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700" htmlFor="notes">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Check Out"}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Create new checkout page**

Create `apps/web/app/(library)/checkouts/new/page.tsx`:
```tsx
import Link from "next/link"
import { auth } from "@/auth"
import { getBooksForUser } from "@/lib/queries/books"
import { getContactsForUser } from "@/lib/queries/contacts"
import { createCheckout } from "@/lib/actions/checkouts"
import { CheckoutForm } from "@/components/checkouts/checkout-form"

export default async function NewCheckoutPage() {
  const session = await auth()
  const userId = session!.user!.id!

  const [books, contacts] = await Promise.all([
    getBooksForUser(userId),
    getContactsForUser(userId),
  ])

  const availableBooks = books.filter((b) => !b.isCheckedOut)

  return (
    <div>
      <div className="mb-6">
        <Link href="/checkouts" className="text-sm text-zinc-500 hover:text-zinc-700">
          ← Back to checkouts
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Check Out a Book</h1>
      </div>

      {availableBooks.length === 0 ? (
        <p className="text-zinc-500">
          All books are currently checked out.{" "}
          <Link href="/books" className="text-zinc-900 underline">
            Return one first.
          </Link>
        </p>
      ) : (
        <CheckoutForm
          action={createCheckout}
          books={availableBooks}
          contacts={contacts}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 3: Type-check**

```bash
cd apps/web && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add \
  apps/web/components/checkouts/checkout-form.tsx \
  "apps/web/app/(library)/checkouts/new/page.tsx"
git commit -m "feat: checkout form and new checkout page"
```

---

## Phase 6: Polish

### Task 22: Checkout history section

Add a "History" section below active checkouts showing returned books.

**Files:**
- Modify: `apps/web/app/(library)/checkouts/page.tsx`

- [ ] **Step 1: Add history to checkouts page**

In `apps/web/app/(library)/checkouts/page.tsx`, add the history query and section.

Replace the full file with:
```tsx
import Link from "next/link"
import { auth } from "@/auth"
import { getActiveCheckouts, getCheckoutHistory } from "@/lib/queries/checkouts"
import { returnBook } from "@/lib/actions/checkouts"

function formatDate(d: Date | null) {
  if (!d) return null
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(d)
}

export default async function CheckoutsPage() {
  const session = await auth()
  const userId = session!.user!.id!

  const [active, history] = await Promise.all([
    getActiveCheckouts(userId),
    getCheckoutHistory(userId),
  ])

  return (
    <div className="flex flex-col gap-10">
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900">Active Checkouts</h1>
          <Link
            href="/checkouts/new"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Check Out a Book
          </Link>
        </div>

        {active.length === 0 ? (
          <p className="text-zinc-500">No books are currently checked out.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {active.map((checkout) => (
              <li
                key={checkout.id}
                className="rounded-xl border border-zinc-200 bg-white px-5 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-zinc-900">{checkout.book.title}</p>
                    {checkout.book.authors && (
                      <p className="text-sm text-zinc-500">{checkout.book.authors}</p>
                    )}
                    <p className="mt-1 text-sm text-zinc-600">
                      {checkout.contact
                        ? `Checked out to ${checkout.contact.name}`
                        : "Checked out to yourself"}
                    </p>
                    <p className="text-xs text-zinc-400">
                      Since {formatDate(checkout.checkedOutAt)}
                      {checkout.dueDate && ` · Due ${formatDate(checkout.dueDate)}`}
                    </p>
                    {checkout.notes && (
                      <p className="mt-1 text-xs text-zinc-500 italic">{checkout.notes}</p>
                    )}
                  </div>
                  <form action={returnBook} className="shrink-0">
                    <input type="hidden" name="checkoutId" value={checkout.id} />
                    <button
                      type="submit"
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                    >
                      Mark Returned
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {history.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-zinc-700">History</h2>
          <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
            {history.map((checkout) => (
              <li key={checkout.id} className="px-5 py-4">
                <p className="font-medium text-zinc-900">{checkout.book.title}</p>
                <p className="text-sm text-zinc-500">
                  {checkout.contact ? checkout.contact.name : "Yourself"} ·{" "}
                  {formatDate(checkout.checkedOutAt)} → {formatDate(checkout.returnedAt)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
cd apps/web && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add "apps/web/app/(library)/checkouts/page.tsx"
git commit -m "feat: add checkout history section"
```

---

### Task 23: Final type-check and lint pass

- [ ] **Step 1: Run full type-check**

```bash
cd apps/web && npx tsc --noEmit
```
Expected: zero errors.

- [ ] **Step 2: Run lint**

```bash
cd apps/web && npm run lint
```
Expected: zero warnings or errors.

- [ ] **Step 3: Run all tests**

```bash
cd apps/web && npm test
```
Expected: all tests pass.

- [ ] **Step 4: Commit any lint fixes**

```bash
git add -A
git commit -m "chore: fix any lint warnings"
```

---

## Self-Review: Spec Coverage

| Requirement | Covered by |
|---|---|
| Sign-in with GitHub | Task 3 |
| Sign-out | Task 4, 5 |
| App navigation | Task 5 |
| List books with availability | Task 10 |
| Add book | Task 11 |
| Edit book | Task 13 |
| Delete book | Task 12 |
| List contacts | Task 17 |
| Add contact | Task 17 |
| Edit contact | Task 17 |
| Delete contact | Task 17 |
| List active checkouts | Task 20 |
| Check out a book to self or contact | Task 21 |
| Mark book as returned | Task 20 |
| Checkout history | Task 22 |
| Unit tests for all mutations | Tasks 7–9, 15, 19 |
| Type safety end-to-end | Tasks 6, 14, 18 |

**Not covered (intentional scope limit):**
- Book cover image via ISBN lookup (open-books API integration — add later)
- Push notifications for overdue books (requires a cron job)
- Expo mobile app (placeholder only — initialize separately with `npx create-expo-app`)
- Multi-user libraries / sharing (single-user scope)
