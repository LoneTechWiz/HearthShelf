# Bulk CSV Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a library owner bulk-import books and contacts from a CSV file, upserting duplicates instead of creating them, with a follow-up bulk-edit page to enrich imported books via ISBN lookup.

**Architecture:** A dependency-free CSV parser (`lib/csv/`) feeds two server actions (`importBooks`, `importContacts`) that validate rows, upsert per-user via new query helpers, and return a skip-and-report summary. A shared `CsvImport` client component drives both import pages. A books bulk-edit page reuses the existing Open Library `lookupByIsbn` to fill empty fields.

**Tech Stack:** Next.js 16 (App Router, async `searchParams`), React 19 (`useActionState`), Drizzle ORM (`postgres`), Vitest (unit + integration projects), Testing Library.

**Spec:** `docs/superpowers/specs/2026-06-09-bulk-csv-import-design.md`

**Conventions to match:**
- Unit tests live in `__tests__/lib/**` and `__tests__/actions/**`, run with `npm test`.
- Integration tests live in `__tests__/integration/**`, run with `npm run test:integration` (needs the test DB: `npm run test:db:up` once).
- Action unit tests mock `@/auth`, `@/lib/queries/*`, `next/cache`, `next/navigation`.
- All DB access lives in `lib/queries/*`; actions never touch the DB directly.
- Run all commands from `apps/web/`.

---

## File Structure

**New**
- `lib/csv/parse.ts` — `parseCsv` + `toRecords` (pure, tested).
- `lib/csv/types.ts` — shared `ImportResult` / `ImportSkip` types.
- `components/csv-import.tsx` — shared import UI (file → action → summary).
- `app/(library)/books/import/page.tsx` — books import page.
- `app/(library)/contacts/import/page.tsx` — contacts import page.
- `app/(library)/books/bulk-edit/page.tsx` — books bulk-edit page.
- `components/books/book-bulk-edit.tsx` — editable table with per-row ISBN lookup.
- `__tests__/lib/csv/parse.test.ts`
- `__tests__/integration/queries/books-import.test.ts`
- `__tests__/integration/queries/contacts-import.test.ts`
- `__tests__/actions/books-import.test.ts`
- `__tests__/actions/contacts-import.test.ts`

**Modified**
- `lib/queries/books.ts` — add `findBookMatch`, `createBookRecordReturningId`, `getBooksByIds`.
- `lib/queries/contacts.ts` — add `findContactMatch`.
- `lib/actions/books.ts` — add `importBooks`, `bulkUpdateBooks`.
- `lib/actions/contacts.ts` — add `importContacts`.
- `app/(library)/books/page.tsx` — add "Import CSV" and "Bulk edit" links.
- `app/(library)/contacts/page.tsx` — add "Import CSV" link.

---

## Task 1: CSV parser — `parseCsv`

**Files:**
- Create: `apps/web/lib/csv/parse.ts`
- Test: `apps/web/__tests__/lib/csv/parse.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `apps/web/__tests__/lib/csv/parse.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { parseCsv } from "@/lib/csv/parse"

describe("parseCsv", () => {
  it("parses a simple header + row", () => {
    expect(parseCsv("a,b\n1,2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ])
  })

  it("keeps commas inside quoted fields", () => {
    expect(parseCsv('title\n"Dune, part 1"')).toEqual([
      ["title"],
      ["Dune, part 1"],
    ])
  })

  it("unescapes doubled quotes inside quoted fields", () => {
    expect(parseCsv('a\n"She said ""hi"""')).toEqual([
      ["a"],
      ['She said "hi"'],
    ])
  })

  it("handles CRLF line endings and a trailing newline", () => {
    expect(parseCsv("a,b\r\n1,2\r\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ])
  })

  it("skips fully blank lines", () => {
    expect(parseCsv("a\n\n1\n")).toEqual([["a"], ["1"]])
  })

  it("returns an empty array for empty input", () => {
    expect(parseCsv("")).toEqual([])
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- parse`
Expected: FAIL — cannot resolve `@/lib/csv/parse`.

- [ ] **Step 3: Implement `parseCsv`**

Create `apps/web/lib/csv/parse.ts`:

```ts
// Splits CSV text into rows of cells. Handles "quoted, fields", "" escaped
// quotes, and CRLF/LF line endings. Fully blank lines are dropped, so reported
// line numbers count non-blank rows (header = line 1).
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false
  let i = 0

  while (i < text.length) {
    const char = text[i]

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        inQuotes = false
        i++
        continue
      }
      field += char
      i++
      continue
    }

    if (char === '"') {
      inQuotes = true
      i++
    } else if (char === ",") {
      row.push(field)
      field = ""
      i++
    } else if (char === "\r") {
      i++
    } else if (char === "\n") {
      row.push(field)
      rows.push(row)
      row = []
      field = ""
      i++
    } else {
      field += char
      i++
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ""))
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- parse`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/csv/parse.ts apps/web/__tests__/lib/csv/parse.test.ts
git commit -m "feat: add dependency-free CSV parser"
```

---

## Task 2: Header mapping — `toRecords`

**Files:**
- Modify: `apps/web/lib/csv/parse.ts`
- Test: `apps/web/__tests__/lib/csv/parse.test.ts`

- [ ] **Step 1: Add failing tests**

Append to `apps/web/__tests__/lib/csv/parse.test.ts`:

```ts
import { toRecords } from "@/lib/csv/parse"

describe("toRecords", () => {
  it("maps cells onto expected columns case-insensitively", () => {
    const rows = [
      ["Title", "ISBN"],
      ["Dune", "123"],
    ]
    const { records, missingColumns } = toRecords(rows, ["title", "isbn", "authors"])
    expect(missingColumns).toEqual(["authors"])
    expect(records).toEqual([
      { line: 2, values: { title: "Dune", isbn: "123", authors: null } },
    ])
  })

  it("turns empty cells into null and trims values", () => {
    const rows = [
      ["title", "isbn"],
      [" Dune ", ""],
    ]
    const { records } = toRecords(rows, ["title", "isbn"])
    expect(records[0].values).toEqual({ title: "Dune", isbn: null })
  })

  it("reports a missing required header in missingColumns", () => {
    const rows = [["isbn"], ["123"]]
    const { missingColumns } = toRecords(rows, ["title", "isbn"])
    expect(missingColumns).toContain("title")
  })

  it("returns no records and all columns missing for empty rows", () => {
    const { records, missingColumns } = toRecords([], ["title"])
    expect(records).toEqual([])
    expect(missingColumns).toEqual(["title"])
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- parse`
Expected: FAIL — `toRecords` is not exported.

- [ ] **Step 3: Implement `toRecords`**

Append to `apps/web/lib/csv/parse.ts`:

```ts
export type CsvRecord = {
  line: number
  values: Record<string, string | null>
}

// Maps parsed rows onto expected columns using row 0 as the header. Matching is
// case-insensitive and whitespace-trimmed. Unknown columns are ignored; absent
// or empty cells become null. missingColumns lists expected columns whose header
// is absent (the caller decides which are required).
export function toRecords(
  rows: string[][],
  columns: readonly string[]
): { records: CsvRecord[]; missingColumns: string[] } {
  if (rows.length === 0) {
    return { records: [], missingColumns: [...columns] }
  }

  const header = rows[0].map((h) => h.trim().toLowerCase())
  const indexByColumn = new Map<string, number>()
  for (const column of columns) {
    indexByColumn.set(column, header.indexOf(column.toLowerCase()))
  }
  const missingColumns = columns.filter((c) => indexByColumn.get(c) === -1)

  const records = rows.slice(1).map((cells, i) => {
    const values: Record<string, string | null> = {}
    for (const column of columns) {
      const index = indexByColumn.get(column)!
      const raw = index >= 0 ? (cells[index] ?? "").trim() : ""
      values[column] = raw === "" ? null : raw
    }
    return { line: i + 2, values } // header is line 1
  })

  return { records, missingColumns }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- parse`
Expected: PASS (10 tests total).

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/csv/parse.ts apps/web/__tests__/lib/csv/parse.test.ts
git commit -m "feat: map CSV rows onto expected columns"
```

---

## Task 3: Book matching & batch queries

**Files:**
- Modify: `apps/web/lib/queries/books.ts`
- Test: `apps/web/__tests__/integration/queries/books-import.test.ts`

> Integration tests need the test DB. Once: `npm run test:db:up` then `npm run db:push:test`.

- [ ] **Step 1: Write failing integration tests**

Create `apps/web/__tests__/integration/queries/books-import.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest"
import {
  createBookRecord,
  createBookRecordReturningId,
  findBookMatch,
  getBooksByIds,
} from "@/lib/queries/books"
import { users } from "@/lib/db/schema"
import { db, truncateAll } from "../helpers"

const USER_ID = "itest-user"

beforeEach(async () => {
  await truncateAll()
  await db.insert(users).values({ id: USER_ID, email: "itest@example.com" })
})

describe("findBookMatch", () => {
  it("matches an existing book by ISBN", async () => {
    await createBookRecord(USER_ID, {
      title: "Dune",
      authors: "Frank Herbert",
      isbn: "9780441013593",
      description: null,
      coverUrl: null,
    })
    const match = await findBookMatch(USER_ID, {
      title: "Different Title",
      authors: null,
      isbn: "9780441013593",
    })
    expect(match?.title).toBe("Dune")
  })

  it("falls back to case-insensitive title + authors when isbn is null", async () => {
    await createBookRecord(USER_ID, {
      title: "Dune",
      authors: "Frank Herbert",
      isbn: null,
      description: null,
      coverUrl: null,
    })
    const match = await findBookMatch(USER_ID, {
      title: "dune",
      authors: "frank herbert",
      isbn: null,
    })
    expect(match?.title).toBe("Dune")
  })

  it("returns null when nothing matches", async () => {
    const match = await findBookMatch(USER_ID, {
      title: "Nope",
      authors: null,
      isbn: null,
    })
    expect(match).toBeNull()
  })

  it("does not match another user's book", async () => {
    await db.insert(users).values({ id: "other", email: "other@example.com" })
    await createBookRecord("other", {
      title: "Dune",
      authors: null,
      isbn: "9780441013593",
      description: null,
      coverUrl: null,
    })
    const match = await findBookMatch(USER_ID, {
      title: "Dune",
      authors: null,
      isbn: "9780441013593",
    })
    expect(match).toBeNull()
  })
})

describe("createBookRecordReturningId + getBooksByIds", () => {
  it("returns the new id and reads it back", async () => {
    const id = await createBookRecordReturningId(USER_ID, {
      title: "Dune",
      authors: null,
      isbn: null,
      description: null,
      coverUrl: null,
    })
    expect(id).toBeTypeOf("string")
    const books = await getBooksByIds(USER_ID, [id])
    expect(books).toHaveLength(1)
    expect(books[0].title).toBe("Dune")
  })

  it("returns an empty array when given no ids", async () => {
    expect(await getBooksByIds(USER_ID, [])).toEqual([])
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:integration -- books-import`
Expected: FAIL — `findBookMatch` / `createBookRecordReturningId` / `getBooksByIds` not exported.

- [ ] **Step 3: Implement the query helpers**

In `apps/web/lib/queries/books.ts`, update the drizzle import to include `inArray` and `sql`:

```ts
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm"
```

Append these functions:

```ts
type BookData = {
  title: string
  authors: string | null
  isbn: string | null
  description: string | null
  coverUrl: string | null
}

// Finds an existing book for upsert. Matches on ISBN when the row has one;
// otherwise on case-insensitive title + authors (null authors matched as null).
export async function findBookMatch(
  userId: string,
  row: { title: string; authors: string | null; isbn: string | null }
): Promise<BookRow | null> {
  if (row.isbn) {
    const rows = await db
      .select()
      .from(books)
      .where(and(eq(books.userId, userId), eq(books.isbn, row.isbn)))
      .limit(1)
    return rows[0] ?? null
  }

  const rows = await db
    .select()
    .from(books)
    .where(
      and(
        eq(books.userId, userId),
        sql`lower(${books.title}) = lower(${row.title})`,
        row.authors === null
          ? isNull(books.authors)
          : sql`lower(${books.authors}) = lower(${row.authors})`
      )
    )
    .limit(1)
  return rows[0] ?? null
}

export async function createBookRecordReturningId(
  userId: string,
  data: BookData
): Promise<string> {
  const [row] = await db
    .insert(books)
    .values({ userId, ...data })
    .returning({ id: books.id })
  return row.id
}

export async function getBooksByIds(
  userId: string,
  ids: string[]
): Promise<BookRow[]> {
  if (ids.length === 0) return []
  return db
    .select()
    .from(books)
    .where(and(eq(books.userId, userId), inArray(books.id, ids)))
    .orderBy(desc(books.createdAt))
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm run test:integration -- books-import`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/queries/books.ts apps/web/__tests__/integration/queries/books-import.test.ts
git commit -m "feat: add book match + batch query helpers for import"
```

---

## Task 4: Contact matching query

**Files:**
- Modify: `apps/web/lib/queries/contacts.ts`
- Test: `apps/web/__tests__/integration/queries/contacts-import.test.ts`

- [ ] **Step 1: Write failing integration tests**

Create `apps/web/__tests__/integration/queries/contacts-import.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest"
import { createContactRecord, findContactMatch } from "@/lib/queries/contacts"
import { users } from "@/lib/db/schema"
import { db, truncateAll } from "../helpers"

const USER_ID = "itest-user"

beforeEach(async () => {
  await truncateAll()
  await db.insert(users).values({ id: USER_ID, email: "itest@example.com" })
})

describe("findContactMatch", () => {
  it("matches by email when present", async () => {
    await createContactRecord(USER_ID, {
      name: "Alice",
      email: "alice@example.com",
      phone: null,
    })
    const match = await findContactMatch(USER_ID, {
      name: "Totally Different",
      email: "alice@example.com",
    })
    expect(match?.name).toBe("Alice")
  })

  it("falls back to case-insensitive name when email is null", async () => {
    await createContactRecord(USER_ID, {
      name: "Bob",
      email: null,
      phone: null,
    })
    const match = await findContactMatch(USER_ID, { name: "bob", email: null })
    expect(match?.name).toBe("Bob")
  })

  it("returns null when nothing matches", async () => {
    expect(
      await findContactMatch(USER_ID, { name: "Nobody", email: null })
    ).toBeNull()
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:integration -- contacts-import`
Expected: FAIL — `findContactMatch` not exported.

- [ ] **Step 3: Implement `findContactMatch`**

In `apps/web/lib/queries/contacts.ts`, update the drizzle import:

```ts
import { and, asc, eq, isNull, sql } from "drizzle-orm"
```

Append:

```ts
// Finds an existing contact for upsert. Matches on email when present; otherwise
// on case-insensitive name.
export async function findContactMatch(
  userId: string,
  row: { name: string; email: string | null }
): Promise<ContactRow | null> {
  if (row.email) {
    const rows = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.userId, userId), eq(contacts.email, row.email)))
      .limit(1)
    return rows[0] ?? null
  }

  const rows = await db
    .select()
    .from(contacts)
    .where(
      and(
        eq(contacts.userId, userId),
        sql`lower(${contacts.name}) = lower(${row.name})`
      )
    )
    .limit(1)
  return rows[0] ?? null
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm run test:integration -- contacts-import`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/queries/contacts.ts apps/web/__tests__/integration/queries/contacts-import.test.ts
git commit -m "feat: add contact match query helper for import"
```

---

## Task 5: `importBooks` action + shared import types

**Files:**
- Create: `apps/web/lib/csv/types.ts`
- Modify: `apps/web/lib/actions/books.ts`
- Test: `apps/web/__tests__/actions/books-import.test.ts`

- [ ] **Step 1: Create the shared result type**

Create `apps/web/lib/csv/types.ts`:

```ts
export type ImportSkip = { line: number; reason: string }

export type ImportResult =
  | { error: string }
  | {
      created: number
      updated: number
      skipped: ImportSkip[]
      importedIds?: string[]
    }
```

- [ ] **Step 2: Write failing action tests**

Create `apps/web/__tests__/actions/books-import.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import type { Session } from "next-auth"

vi.mock("@/auth")
vi.mock("@/lib/queries/books")
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/navigation", () => ({ redirect: vi.fn() }))

import { auth } from "@/auth"
import {
  findBookMatch,
  createBookRecordReturningId,
  updateBookRecord,
} from "@/lib/queries/books"

const mockedAuth = vi.mocked(auth as unknown as () => Promise<Session | null>)
const signedIn = () =>
  mockedAuth.mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)

function formWith(csv: string): FormData {
  const fd = new FormData()
  fd.set("csv", csv)
  return fd
}

describe("importBooks", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns error when not authenticated", async () => {
    mockedAuth.mockResolvedValue(null)
    const { importBooks } = await import("@/lib/actions/books")
    expect(await importBooks(null, formWith("title\nDune"))).toEqual({
      error: "Unauthorized",
    })
  })

  it("rejects an empty file", async () => {
    signedIn()
    const { importBooks } = await import("@/lib/actions/books")
    expect(await importBooks(null, formWith("   "))).toEqual({
      error: "The file is empty",
    })
  })

  it("rejects a file missing the title column", async () => {
    signedIn()
    const { importBooks } = await import("@/lib/actions/books")
    const result = await importBooks(null, formWith("isbn\n123"))
    expect(result).toEqual({ error: "CSV is missing a required \"title\" column" })
  })

  it("creates a new book when no match exists", async () => {
    signedIn()
    vi.mocked(findBookMatch).mockResolvedValue(null)
    vi.mocked(createBookRecordReturningId).mockResolvedValue("b1")
    const { importBooks } = await import("@/lib/actions/books")
    const result = await importBooks(null, formWith("title,isbn\nDune,123"))
    expect(createBookRecordReturningId).toHaveBeenCalledWith("u1", {
      title: "Dune",
      authors: null,
      isbn: "123",
      description: null,
      coverUrl: null,
    })
    expect(result).toEqual({
      created: 1,
      updated: 0,
      skipped: [],
      importedIds: ["b1"],
    })
  })

  it("skips a row with no title and reports its line", async () => {
    signedIn()
    vi.mocked(findBookMatch).mockResolvedValue(null)
    vi.mocked(createBookRecordReturningId).mockResolvedValue("b1")
    const { importBooks } = await import("@/lib/actions/books")
    const result = await importBooks(null, formWith("title,isbn\n,123\nDune,456"))
    expect(result).toMatchObject({
      created: 1,
      updated: 0,
      skipped: [{ line: 2, reason: "Missing title" }],
    })
  })

  it("updates an existing match, preserving fields the CSV leaves blank", async () => {
    signedIn()
    vi.mocked(findBookMatch).mockResolvedValue({
      id: "b9",
      userId: "u1",
      title: "Dune",
      authors: "Frank Herbert",
      isbn: "123",
      description: "Existing desc",
      coverUrl: "http://cover",
      createdAt: new Date(),
    })
    const { importBooks } = await import("@/lib/actions/books")
    const result = await importBooks(null, formWith("title,isbn\nDune,123"))
    expect(updateBookRecord).toHaveBeenCalledWith("b9", "u1", {
      title: "Dune",
      authors: "Frank Herbert",
      isbn: "123",
      description: "Existing desc",
      coverUrl: "http://cover",
    })
    expect(result).toMatchObject({ created: 0, updated: 1, importedIds: ["b9"] })
  })
})
```

- [ ] **Step 3: Run to verify failure**

Run: `npm test -- books-import`
Expected: FAIL — `importBooks` not exported.

- [ ] **Step 4: Implement `importBooks`**

In `apps/web/lib/actions/books.ts`, add imports near the top (below the existing imports):

```ts
import { parseCsv, toRecords } from "@/lib/csv/parse"
import type { ImportResult, ImportSkip } from "@/lib/csv/types"
import {
  createBookRecordReturningId,
  findBookMatch,
} from "@/lib/queries/books"
```

Append the action:

```ts
const BOOK_COLUMNS = ["title", "authors", "isbn", "description", "coverUrl"] as const

export async function importBooks(
  _prevState: ImportResult | null,
  formData: FormData
): Promise<ImportResult> {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }
  const userId = session.user.id

  const text = String(formData.get("csv") ?? "")
  if (text.trim() === "") return { error: "The file is empty" }

  const { records, missingColumns } = toRecords(parseCsv(text), BOOK_COLUMNS)
  if (missingColumns.includes("title")) {
    return { error: 'CSV is missing a required "title" column' }
  }

  let created = 0
  let updated = 0
  const skipped: ImportSkip[] = []
  const importedIds: string[] = []

  for (const { line, values } of records) {
    const title = values.title
    if (!title) {
      skipped.push({ line, reason: "Missing title" })
      continue
    }
    const data = {
      title,
      authors: values.authors,
      isbn: values.isbn,
      description: values.description,
      coverUrl: values.coverUrl,
    }

    const existing = await findBookMatch(userId, data)
    if (existing) {
      await updateBookRecord(existing.id, userId, {
        title,
        authors: data.authors ?? existing.authors,
        isbn: data.isbn ?? existing.isbn,
        description: data.description ?? existing.description,
        coverUrl: data.coverUrl ?? existing.coverUrl,
      })
      updated++
      importedIds.push(existing.id)
    } else {
      const id = await createBookRecordReturningId(userId, data)
      created++
      importedIds.push(id)
    }
  }

  revalidatePath("/books")
  return { created, updated, skipped, importedIds }
}
```

> Note: `updateBookRecord` is already imported at the top of this file.

- [ ] **Step 5: Run to verify pass**

Run: `npm test -- books-import`
Expected: PASS (6 tests).

- [ ] **Step 6: Commit**

```bash
git add apps/web/lib/csv/types.ts apps/web/lib/actions/books.ts apps/web/__tests__/actions/books-import.test.ts
git commit -m "feat: add importBooks upsert action"
```

---

## Task 6: `importContacts` action

**Files:**
- Modify: `apps/web/lib/actions/contacts.ts`
- Test: `apps/web/__tests__/actions/contacts-import.test.ts`

- [ ] **Step 1: Write failing action tests**

Create `apps/web/__tests__/actions/contacts-import.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import type { Session } from "next-auth"

vi.mock("@/auth")
vi.mock("@/lib/queries/contacts")
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/navigation", () => ({ redirect: vi.fn() }))

import { auth } from "@/auth"
import {
  findContactMatch,
  createContactRecord,
  updateContactRecord,
} from "@/lib/queries/contacts"

const mockedAuth = vi.mocked(auth as unknown as () => Promise<Session | null>)
const signedIn = () =>
  mockedAuth.mockResolvedValue({ user: { id: "u1" }, expires: "" } as Session)

function formWith(csv: string): FormData {
  const fd = new FormData()
  fd.set("csv", csv)
  return fd
}

describe("importContacts", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns error when not authenticated", async () => {
    mockedAuth.mockResolvedValue(null)
    const { importContacts } = await import("@/lib/actions/contacts")
    expect(await importContacts(null, formWith("name\nAlice"))).toEqual({
      error: "Unauthorized",
    })
  })

  it("rejects a file missing the name column", async () => {
    signedIn()
    const { importContacts } = await import("@/lib/actions/contacts")
    expect(await importContacts(null, formWith("email\na@b.com"))).toEqual({
      error: 'CSV is missing a required "name" column',
    })
  })

  it("creates a new contact when no match exists", async () => {
    signedIn()
    vi.mocked(findContactMatch).mockResolvedValue(null)
    const { importContacts } = await import("@/lib/actions/contacts")
    const result = await importContacts(
      null,
      formWith("name,email\nAlice,alice@example.com")
    )
    expect(createContactRecord).toHaveBeenCalledWith("u1", {
      name: "Alice",
      email: "alice@example.com",
      phone: null,
    })
    expect(result).toEqual({ created: 1, updated: 0, skipped: [] })
  })

  it("skips a row with no name and reports its line", async () => {
    signedIn()
    vi.mocked(findContactMatch).mockResolvedValue(null)
    const { importContacts } = await import("@/lib/actions/contacts")
    const result = await importContacts(
      null,
      formWith("name,email\n,a@b.com\nBob,bob@b.com")
    )
    expect(result).toMatchObject({
      created: 1,
      skipped: [{ line: 2, reason: "Missing name" }],
    })
  })

  it("updates an existing match, preserving fields the CSV leaves blank", async () => {
    signedIn()
    vi.mocked(findContactMatch).mockResolvedValue({
      id: "c9",
      userId: "u1",
      name: "Alice",
      email: "alice@example.com",
      phone: "555-1234",
      createdAt: new Date(),
    })
    const { importContacts } = await import("@/lib/actions/contacts")
    const result = await importContacts(
      null,
      formWith("name,email\nAlice,alice@example.com")
    )
    expect(updateContactRecord).toHaveBeenCalledWith("c9", "u1", {
      name: "Alice",
      email: "alice@example.com",
      phone: "555-1234",
    })
    expect(result).toMatchObject({ created: 0, updated: 1 })
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- contacts-import`
Expected: FAIL — `importContacts` not exported.

- [ ] **Step 3: Implement `importContacts`**

In `apps/web/lib/actions/contacts.ts`, add imports (extend the existing query import and add the CSV imports):

```ts
import { parseCsv, toRecords } from "@/lib/csv/parse"
import type { ImportResult, ImportSkip } from "@/lib/csv/types"
import { findContactMatch } from "@/lib/queries/contacts"
```

> `createContactRecord` and `updateContactRecord` are already imported at the top of this file.

Append the action:

```ts
const CONTACT_COLUMNS = ["name", "email", "phone"] as const

export async function importContacts(
  _prevState: ImportResult | null,
  formData: FormData
): Promise<ImportResult> {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }
  const userId = session.user.id

  const text = String(formData.get("csv") ?? "")
  if (text.trim() === "") return { error: "The file is empty" }

  const { records, missingColumns } = toRecords(parseCsv(text), CONTACT_COLUMNS)
  if (missingColumns.includes("name")) {
    return { error: 'CSV is missing a required "name" column' }
  }

  let created = 0
  let updated = 0
  const skipped: ImportSkip[] = []

  for (const { line, values } of records) {
    const name = values.name
    if (!name) {
      skipped.push({ line, reason: "Missing name" })
      continue
    }
    const data = { name, email: values.email, phone: values.phone }

    const existing = await findContactMatch(userId, data)
    if (existing) {
      await updateContactRecord(existing.id, userId, {
        name,
        email: data.email ?? existing.email,
        phone: data.phone ?? existing.phone,
      })
      updated++
    } else {
      await createContactRecord(userId, data)
      created++
    }
  }

  revalidatePath("/contacts")
  return { created, updated, skipped }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- contacts-import`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/actions/contacts.ts apps/web/__tests__/actions/contacts-import.test.ts
git commit -m "feat: add importContacts upsert action"
```

---

## Task 7: Shared `CsvImport` component

**Files:**
- Create: `apps/web/components/csv-import.tsx`
- Test: `apps/web/__tests__/components/csv-import.test.tsx`

- [ ] **Step 1: Write the failing component test**

Create `apps/web/__tests__/components/csv-import.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { CsvImport } from "@/components/csv-import"

const columns = [
  { name: "title", required: true, example: "Dune" },
  { name: "isbn", example: "123" },
]

describe("CsvImport", () => {
  it("renders the file input and expected columns", () => {
    render(
      <CsvImport
        action={vi.fn().mockResolvedValue(null)}
        entity="books"
        columns={columns}
      />
    )
    expect(screen.getByLabelText(/CSV file/i)).toBeInTheDocument()
    expect(screen.getByText(/title/)).toBeInTheDocument()
    expect(screen.getByText(/isbn/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /import/i })).toBeDisabled()
  })

  it("offers a template download link", () => {
    render(
      <CsvImport
        action={vi.fn().mockResolvedValue(null)}
        entity="books"
        columns={columns}
      />
    )
    const link = screen.getByRole("link", { name: /template/i })
    expect(link).toHaveAttribute("download")
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- csv-import`
Expected: FAIL — cannot resolve `@/components/csv-import`.

- [ ] **Step 3: Implement `CsvImport`**

Create `apps/web/components/csv-import.tsx`:

```tsx
"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import type { ImportResult } from "@/lib/csv/types"

type ImportAction = (
  prevState: ImportResult | null,
  formData: FormData
) => Promise<ImportResult>

interface Column {
  name: string
  required?: boolean
  example?: string
}

interface CsvImportProps {
  action: ImportAction
  columns: Column[]
  entity: string
  nextStep?: { hrefBase: string; label: string }
}

export function CsvImport({ action, columns, entity, nextStep }: CsvImportProps) {
  const [state, formAction, isPending] = useActionState(action, null)
  const [text, setText] = useState("")
  const [fileName, setFileName] = useState("")

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      setText("")
      setFileName("")
      return
    }
    setFileName(file.name)
    setText(await file.text())
  }

  const header = columns.map((c) => c.name).join(",")
  const sample = columns.map((c) => c.example ?? "").join(",")
  const templateHref = `data:text/csv;charset=utf-8,${encodeURIComponent(
    `${header}\n${sample}\n`
  )}`

  const succeeded = state !== null && !("error" in state)

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-lg">
      <input type="hidden" name="csv" value={text} />

      <div className="flex flex-col gap-1">
        <label
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          htmlFor="csv-file"
        >
          CSV file
        </label>
        <input
          id="csv-file"
          type="file"
          accept=".csv,text/csv"
          onChange={handleFile}
          className="text-sm text-zinc-700 dark:text-zinc-300"
        />
        {fileName && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{fileName}</p>
        )}
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Expected columns:{" "}
        {columns.map((c) => (
          <span key={c.name} className="font-mono">
            {c.name}
            {c.required ? "*" : ""}{" "}
          </span>
        ))}
        —{" "}
        <Link
          href={templateHref}
          download={`${entity}-template.csv`}
          className="underline hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          download template
        </Link>
      </p>

      <button
        type="submit"
        disabled={isPending || !text}
        className="self-start rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {isPending ? "Importing…" : "Import"}
      </button>

      {state !== null && "error" in state && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {state.error}
        </p>
      )}

      {succeeded && (
        <div className="rounded-md border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="font-medium text-zinc-900 dark:text-zinc-100">
            Imported {entity}: {state.created} created, {state.updated} updated,{" "}
            {state.skipped.length} skipped.
          </p>
          {state.skipped.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-zinc-600 dark:text-zinc-400">
              {state.skipped.map((s) => (
                <li key={s.line}>
                  Line {s.line}: {s.reason}
                </li>
              ))}
            </ul>
          )}
          {nextStep && state.importedIds && state.importedIds.length > 0 && (
            <Link
              href={`${nextStep.hrefBase}?ids=${state.importedIds.join(",")}`}
              className="mt-3 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              {nextStep.label}
            </Link>
          )}
        </div>
      )}
    </form>
  )
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- csv-import`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/csv-import.tsx apps/web/__tests__/components/csv-import.test.tsx
git commit -m "feat: add shared CsvImport component"
```

---

## Task 8: Import pages + list links

**Files:**
- Create: `apps/web/app/(library)/books/import/page.tsx`
- Create: `apps/web/app/(library)/contacts/import/page.tsx`
- Modify: `apps/web/app/(library)/books/page.tsx`
- Modify: `apps/web/app/(library)/contacts/page.tsx`

> These are wiring tasks; verify with `npx tsc --noEmit` and a manual smoke test rather than unit tests.

- [ ] **Step 1: Create the books import page**

Create `apps/web/app/(library)/books/import/page.tsx`:

```tsx
import Link from "next/link"
import { CsvImport } from "@/components/csv-import"
import { importBooks } from "@/lib/actions/books"

export default function ImportBooksPage() {
  return (
    <div>
      <div className="mb-6">
        <Link href="/books" className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300">
          ← Back to library
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Import Books</h1>
      </div>
      <CsvImport
        action={importBooks}
        entity="books"
        columns={[
          { name: "title", required: true, example: "Dune" },
          { name: "authors", example: "Frank Herbert" },
          { name: "isbn", example: "9780441013593" },
          { name: "description" },
          { name: "coverUrl" },
        ]}
        nextStep={{ hrefBase: "/books/bulk-edit", label: "Review & enrich imported books" }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Create the contacts import page**

Create `apps/web/app/(library)/contacts/import/page.tsx`:

```tsx
import Link from "next/link"
import { CsvImport } from "@/components/csv-import"
import { importContacts } from "@/lib/actions/contacts"

export default function ImportContactsPage() {
  return (
    <div>
      <div className="mb-6">
        <Link href="/contacts" className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300">
          ← Back to contacts
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Import Contacts</h1>
      </div>
      <CsvImport
        action={importContacts}
        entity="contacts"
        columns={[
          { name: "name", required: true, example: "Alice Reader" },
          { name: "email", example: "alice@example.com" },
          { name: "phone", example: "555-1234" },
        ]}
      />
    </div>
  )
}
```

- [ ] **Step 3: Add links to the Books list header**

In `apps/web/app/(library)/books/page.tsx`, replace the single "Add Book" link block with a link group. Find:

```tsx
        <Link
          href="/books/new"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Add Book
        </Link>
```

Replace with:

```tsx
        <div className="flex items-center gap-2">
          <Link
            href="/books/bulk-edit"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Bulk edit
          </Link>
          <Link
            href="/books/import"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Import CSV
          </Link>
          <Link
            href="/books/new"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Add Book
          </Link>
        </div>
```

- [ ] **Step 4: Add the Import link to the Contacts list header**

In `apps/web/app/(library)/contacts/page.tsx`, find:

```tsx
        <Link
          href="/contacts/new"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Add Contact
        </Link>
```

Replace with:

```tsx
        <div className="flex items-center gap-2">
          <Link
            href="/contacts/import"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Import CSV
          </Link>
          <Link
            href="/contacts/new"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Add Contact
          </Link>
        </div>
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

> The `/books/bulk-edit` link 404s until Task 9 — that is expected and fixed there.

- [ ] **Step 6: Commit**

```bash
git add "apps/web/app/(library)/books/import/page.tsx" "apps/web/app/(library)/contacts/import/page.tsx" "apps/web/app/(library)/books/page.tsx" "apps/web/app/(library)/contacts/page.tsx"
git commit -m "feat: add CSV import pages and list links"
```

---

## Task 9: Books bulk-edit page + component + action

**Files:**
- Modify: `apps/web/lib/actions/books.ts`
- Create: `apps/web/components/books/book-bulk-edit.tsx`
- Create: `apps/web/app/(library)/books/bulk-edit/page.tsx`
- Test: `apps/web/__tests__/actions/books-import.test.ts` (extend with `bulkUpdateBooks`)

- [ ] **Step 1: Add a failing test for `bulkUpdateBooks`**

Append to `apps/web/__tests__/actions/books-import.test.ts`:

```ts
import { updateBookRecord as updateBookRecordMock } from "@/lib/queries/books"

describe("bulkUpdateBooks", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns error when not authenticated", async () => {
    mockedAuth.mockResolvedValue(null)
    const { bulkUpdateBooks } = await import("@/lib/actions/books")
    const fd = new FormData()
    fd.set("rows", "[]")
    expect(await bulkUpdateBooks(null, fd)).toEqual({ error: "Unauthorized" })
  })

  it("updates each row with non-empty values nulled out", async () => {
    signedIn()
    const { bulkUpdateBooks } = await import("@/lib/actions/books")
    const fd = new FormData()
    fd.set(
      "rows",
      JSON.stringify([
        { id: "b1", title: "Dune", authors: "Frank Herbert", isbn: "", description: "", coverUrl: "" },
      ])
    )
    const result = await bulkUpdateBooks(null, fd)
    expect(updateBookRecordMock).toHaveBeenCalledWith("b1", "u1", {
      title: "Dune",
      authors: "Frank Herbert",
      isbn: null,
      description: null,
      coverUrl: null,
    })
    expect(result).toEqual({ updated: 1 })
  })

  it("skips rows missing an id or title", async () => {
    signedIn()
    const { bulkUpdateBooks } = await import("@/lib/actions/books")
    const fd = new FormData()
    fd.set(
      "rows",
      JSON.stringify([
        { id: "", title: "No id", authors: "", isbn: "", description: "", coverUrl: "" },
        { id: "b2", title: "", authors: "", isbn: "", description: "", coverUrl: "" },
      ])
    )
    const result = await bulkUpdateBooks(null, fd)
    expect(updateBookRecordMock).not.toHaveBeenCalled()
    expect(result).toEqual({ updated: 0 })
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- books-import`
Expected: FAIL — `bulkUpdateBooks` not exported.

- [ ] **Step 3: Implement `bulkUpdateBooks`**

Append to `apps/web/lib/actions/books.ts`:

```ts
type BulkEditRow = {
  id: string
  title: string
  authors: string
  isbn: string
  description: string
  coverUrl: string
}

export async function bulkUpdateBooks(
  _prevState: { updated: number } | { error: string } | null,
  formData: FormData
): Promise<{ updated: number } | { error: string }> {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }
  const userId = session.user.id

  let rows: BulkEditRow[]
  try {
    rows = JSON.parse(String(formData.get("rows") ?? "[]"))
  } catch {
    return { error: "Invalid data" }
  }

  let updated = 0
  for (const row of rows) {
    if (!row.id || !row.title?.trim()) continue
    await updateBookRecord(row.id, userId, {
      title: row.title.trim(),
      authors: nullIfEmpty(row.authors),
      isbn: nullIfEmpty(row.isbn),
      description: nullIfEmpty(row.description),
      coverUrl: nullIfEmpty(row.coverUrl),
    })
    updated++
  }

  revalidatePath("/books")
  return { updated }
}
```

> `nullIfEmpty` already accepts `FormDataEntryValue | null`; a plain string is a valid `FormDataEntryValue`, so passing `row.authors` etc. type-checks.

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- books-import`
Expected: PASS (all books-import tests, including the 3 new ones).

- [ ] **Step 5: Implement the bulk-edit component**

Create `apps/web/components/books/book-bulk-edit.tsx`:

```tsx
"use client"

import { useActionState, useState } from "react"
import { lookupByIsbn } from "@/lib/open-library"
import { bulkUpdateBooks } from "@/lib/actions/books"

type Row = {
  id: string
  title: string
  authors: string
  isbn: string
  description: string
  coverUrl: string
}

interface BookBulkEditProps {
  books: Array<{
    id: string
    title: string
    authors: string | null
    isbn: string | null
    description: string | null
    coverUrl: string | null
  }>
}

export function BookBulkEdit({ books }: BookBulkEditProps) {
  const [state, formAction, isPending] = useActionState(bulkUpdateBooks, null)
  const [rows, setRows] = useState<Row[]>(() =>
    books.map((b) => ({
      id: b.id,
      title: b.title,
      authors: b.authors ?? "",
      isbn: b.isbn ?? "",
      description: b.description ?? "",
      coverUrl: b.coverUrl ?? "",
    }))
  )
  const [lookingUp, setLookingUp] = useState<string | null>(null)

  function update(id: string, field: keyof Row, value: string) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  }

  // Fill only the empty fields from an ISBN lookup; never overwrite user input.
  async function handleLookup(id: string) {
    const row = rows.find((r) => r.id === id)
    if (!row?.isbn) return
    setLookingUp(id)
    try {
      const result = await lookupByIsbn(row.isbn)
      if (!result) return
      setRows((rs) =>
        rs.map((r) =>
          r.id === id
            ? {
                ...r,
                authors: r.authors || result.authors,
                coverUrl: r.coverUrl || (result.coverUrl ?? ""),
                description: r.description || (result.description ?? ""),
              }
            : r
        )
      )
    } finally {
      setLookingUp(null)
    }
  }

  if (rows.length === 0) {
    return <p className="text-zinc-500 dark:text-zinc-400">No books to edit.</p>
  }

  const inputClass =
    "w-full rounded-md border border-zinc-300 px-2 py-1 text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="rows" value={JSON.stringify(rows)} />

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="px-3 py-2 font-medium">Title</th>
              <th className="px-3 py-2 font-medium">Author(s)</th>
              <th className="px-3 py-2 font-medium">ISBN</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-3 py-2">
                  <input
                    aria-label={`Title for ${row.id}`}
                    value={row.title}
                    onChange={(e) => update(row.id, "title", e.target.value)}
                    className={inputClass}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    aria-label={`Authors for ${row.id}`}
                    value={row.authors}
                    onChange={(e) => update(row.id, "authors", e.target.value)}
                    className={inputClass}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    aria-label={`ISBN for ${row.id}`}
                    value={row.isbn}
                    onChange={(e) => update(row.id, "isbn", e.target.value)}
                    className={inputClass}
                  />
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => handleLookup(row.id)}
                    disabled={!row.isbn || lookingUp === row.id}
                    className="rounded-md border border-zinc-300 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    {lookingUp === row.id ? "Looking up…" : "Lookup"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="self-start rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {isPending ? "Saving…" : "Save all"}
        </button>
        {state && "updated" in state && (
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            Saved {state.updated} book{state.updated === 1 ? "" : "s"}.
          </span>
        )}
        {state && "error" in state && (
          <span className="text-sm text-red-600 dark:text-red-400">{state.error}</span>
        )}
      </div>
    </form>
  )
}
```

- [ ] **Step 6: Implement the bulk-edit page**

Create `apps/web/app/(library)/books/bulk-edit/page.tsx`:

```tsx
import Link from "next/link"
import { auth } from "@/auth"
import { getBooksForUser, getBooksByIds } from "@/lib/queries/books"
import { BookBulkEdit } from "@/components/books/book-bulk-edit"

export default async function BulkEditBooksPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>
}) {
  const session = await auth()
  const userId = session!.user!.id!
  const { ids } = await searchParams

  const idList = ids ? ids.split(",").filter(Boolean) : null
  const books = idList
    ? await getBooksByIds(userId, idList)
    : await getBooksForUser(userId)

  return (
    <div>
      <div className="mb-6">
        <Link href="/books" className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300">
          ← Back to library
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          {idList ? "Review imported books" : "Bulk edit"}
        </h1>
      </div>
      <BookBulkEdit books={books} />
    </div>
  )
}
```

- [ ] **Step 7: Type-check and smoke-test**

Run: `npx tsc --noEmit`
Expected: no errors.

Then manually: `npm run dev`, sign in, visit `/books/import`, upload a small CSV, confirm the summary, click "Review & enrich imported books", click "Lookup" on a row with an ISBN, "Save all", and confirm the saved count.

- [ ] **Step 8: Commit**

```bash
git add apps/web/lib/actions/books.ts apps/web/components/books/book-bulk-edit.tsx "apps/web/app/(library)/books/bulk-edit/page.tsx" apps/web/__tests__/actions/books-import.test.ts
git commit -m "feat: add books bulk-edit page with per-row ISBN lookup"
```

---

## Task 10: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full unit + component suite**

Run: `npm test`
Expected: PASS, including all new parser, action, and component tests.

- [ ] **Step 2: Run the integration suite**

Run: `npm run test:db:up` (if not already up) then `npm run test:integration`
Expected: PASS, including the new books-import and contacts-import query tests.

- [ ] **Step 3: Lint and type-check**

Run: `npm run lint` and `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Production build**

Run: `npm run build`
Expected: build succeeds; `/books/import`, `/contacts/import`, and `/books/bulk-edit` appear as routes.

- [ ] **Step 5: Commit any lint fixes**

```bash
git add -A
git commit -m "chore: lint and type-check fixes for CSV import" || echo "nothing to commit"
```

---

## Self-Review Notes

- **Spec coverage:** parser (Tasks 1–2); per-user upsert with ISBN→title/author and email→name match + blank-preserving merge + intra-file dedupe via sequential processing (Tasks 3–6); skip-and-report summary (Tasks 5–7); dedicated import pages + list links (Task 8); books bulk-edit for both whole-library and `?ids=` batch with per-row lookup (Task 9); whole-file rejection for empty/missing-required-column (Tasks 5–6); testing across unit/integration/component (all tasks) + final verification (Task 10). No contact enrichment, no preview gate, no export — all out of scope per spec.
- **Type consistency:** `ImportResult`/`ImportSkip` defined once in `lib/csv/types.ts` and shared by both actions and `CsvImport`. `findBookMatch`/`findContactMatch` return the full `BookRow`/`ContactRow` (refines the spec's "id-or-null" for a one-query merge). `CsvRecord` shape (`{ line, values }`) is consistent between `toRecords`, `importBooks`, and `importContacts`.
- **Intra-file dedupe** is achieved by processing rows sequentially against live DB state — a row inserted earlier in the batch is found by `findBookMatch`/`findContactMatch` for a later duplicate row.
