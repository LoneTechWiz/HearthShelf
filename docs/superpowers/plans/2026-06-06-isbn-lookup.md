# ISBN Lookup & Title Autocomplete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Open Library API integration to the Add Book form — title autocomplete with a cover/ISBN dropdown, and ISBN autofill on blur or button click.

**Architecture:** All logic is client-side. A utility module (`lib/open-library.ts`) owns the two API calls. A presentational `BookSearchDropdown` component renders the suggestion list. `BookForm` is converted from uncontrolled to controlled inputs and wired to both features.

**Tech Stack:** React (useState, useEffect), Open Library REST API (no key required), Vitest for unit tests.

---

## File Map

| Action | Path |
|--------|------|
| Create | `apps/web/lib/open-library.ts` |
| Create | `apps/web/__tests__/lib/open-library.test.ts` |
| Create | `apps/web/components/books/book-search-dropdown.tsx` |
| Modify | `apps/web/components/books/book-form.tsx` |

---

## Task 1: Open Library Utility + Tests

**Files:**
- Create: `apps/web/lib/open-library.ts`
- Create: `apps/web/__tests__/lib/open-library.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `apps/web/__tests__/lib/open-library.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { searchByTitle, lookupByIsbn } from "@/lib/open-library"

describe("searchByTitle", () => {
  beforeEach(() => vi.restoreAllMocks())

  it("returns mapped suggestions from API response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        docs: [
          {
            title: "Dune",
            author_name: ["Frank Herbert"],
            isbn: ["9780441013593"],
            cover_i: 8839523,
          },
        ],
      }),
    }))
    const results = await searchByTitle("Dune")
    expect(results).toEqual([{
      title: "Dune",
      authors: "Frank Herbert",
      isbn: "9780441013593",
      coverUrl: "https://covers.openlibrary.org/b/id/8839523-S.jpg",
      description: null,
    }])
  })

  it("skips docs without an isbn", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        docs: [{ title: "No ISBN Book", author_name: ["Author"] }],
      }),
    }))
    const results = await searchByTitle("No ISBN")
    expect(results).toEqual([])
  })

  it("throws when response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }))
    await expect(searchByTitle("Dune")).rejects.toThrow("Search failed")
  })
})

describe("lookupByIsbn", () => {
  beforeEach(() => vi.restoreAllMocks())

  it("returns book details for a valid ISBN", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        "ISBN:9780441013593": {
          title: "Dune",
          authors: [{ name: "Frank Herbert" }],
          cover: { medium: "https://covers.openlibrary.org/b/id/8839523-M.jpg" },
          description: "A science fiction novel.",
        },
      }),
    }))
    const result = await lookupByIsbn("9780441013593")
    expect(result).toEqual({
      title: "Dune",
      authors: "Frank Herbert",
      isbn: "9780441013593",
      coverUrl: "https://covers.openlibrary.org/b/id/8839523-M.jpg",
      description: "A science fiction novel.",
    })
  })

  it("handles description as object with value property", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        "ISBN:9780441013593": {
          title: "Dune",
          authors: [],
          description: { value: "A science fiction novel." },
        },
      }),
    }))
    const result = await lookupByIsbn("9780441013593")
    expect(result?.description).toBe("A science fiction novel.")
  })

  it("returns null when ISBN is not found", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }))
    const result = await lookupByIsbn("0000000000")
    expect(result).toBeNull()
  })

  it("throws when response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }))
    await expect(lookupByIsbn("9780441013593")).rejects.toThrow("Lookup failed")
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd apps/web && npx vitest run __tests__/lib/open-library.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/open-library'`

- [ ] **Step 3: Create the utility module**

Create `apps/web/lib/open-library.ts`:

```ts
export type BookSuggestion = {
  title: string
  authors: string
  isbn: string
  coverUrl: string | null
  description: string | null
}

export async function searchByTitle(title: string): Promise<BookSuggestion[]> {
  const res = await fetch(
    `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=5`
  )
  if (!res.ok) throw new Error("Search failed")
  const data = await res.json()
  return (data.docs ?? []).flatMap((doc: {
    title?: string
    author_name?: string[]
    isbn?: string[]
    cover_i?: number
  }) => {
    const isbn = doc.isbn?.[0]
    if (!isbn) return []
    return [{
      title: doc.title ?? "",
      authors: (doc.author_name ?? []).join(", "),
      isbn,
      coverUrl: doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-S.jpg`
        : null,
      description: null,
    }]
  })
}

export async function lookupByIsbn(isbn: string): Promise<BookSuggestion | null> {
  const res = await fetch(
    `https://openlibrary.org/api/books?bibkeys=ISBN:${encodeURIComponent(isbn)}&format=json&jscmd=data`
  )
  if (!res.ok) throw new Error("Lookup failed")
  const data = await res.json()
  const book = data[`ISBN:${isbn}`]
  if (!book) return null
  const description =
    typeof book.description === "string"
      ? book.description
      : book.description?.value ?? null
  return {
    title: book.title ?? "",
    authors: (book.authors ?? []).map((a: { name: string }) => a.name).join(", "),
    isbn,
    coverUrl: book.cover?.medium ?? null,
    description,
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd apps/web && npx vitest run __tests__/lib/open-library.test.ts
```

Expected: 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/open-library.ts apps/web/__tests__/lib/open-library.test.ts
git commit -m "feat: add Open Library fetch utilities with tests"
```

---

## Task 2: BookSearchDropdown Component

**Files:**
- Create: `apps/web/components/books/book-search-dropdown.tsx`

- [ ] **Step 1: Create the component**

Create `apps/web/components/books/book-search-dropdown.tsx`:

```tsx
"use client"

import { useEffect, useRef } from "react"
import type { BookSuggestion } from "@/lib/open-library"

interface BookSearchDropdownProps {
  suggestions: BookSuggestion[]
  isSearching: boolean
  onSelect: (suggestion: BookSuggestion) => void
  onClose: () => void
}

export function BookSearchDropdown({
  suggestions,
  isSearching,
  onSelect,
  onClose,
}: BookSearchDropdownProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleMouseDown)
    return () => document.removeEventListener("mousedown", handleMouseDown)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute z-10 mt-1 w-full rounded-lg border border-zinc-200 bg-white shadow-lg"
    >
      {isSearching ? (
        <div className="px-3 py-2 text-sm text-zinc-500">Searching…</div>
      ) : suggestions.length === 0 ? (
        <div className="px-3 py-2 text-sm text-zinc-500">No books found</div>
      ) : (
        <ul>
          {suggestions.map((s) => (
            <li key={s.isbn}>
              <button
                type="button"
                onClick={() => onSelect(s)}
                className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-zinc-50"
              >
                {s.coverUrl ? (
                  <img src={s.coverUrl} alt="" className="h-10 w-7 flex-shrink-0 rounded object-cover" />
                ) : (
                  <div className="h-10 w-7 flex-shrink-0 rounded bg-zinc-100" />
                )}
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium text-zinc-900">{s.title}</span>
                  <span className="truncate text-xs text-zinc-500">{s.authors}</span>
                  <span className="text-xs text-zinc-400">{s.isbn}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/books/book-search-dropdown.tsx
git commit -m "feat: add BookSearchDropdown presentational component"
```

---

## Task 3: Wire Up BookForm

**Files:**
- Modify: `apps/web/components/books/book-form.tsx`

- [ ] **Step 1: Replace book-form.tsx with the updated version**

Replace the entire contents of `apps/web/components/books/book-form.tsx` with:

```tsx
"use client"

import { useActionState, useState, useEffect } from "react"
import { searchByTitle, lookupByIsbn } from "@/lib/open-library"
import type { BookSuggestion } from "@/lib/open-library"
import { BookSearchDropdown } from "./book-search-dropdown"

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

  const [title, setTitle] = useState(defaultValues?.title ?? "")
  const [authors, setAuthors] = useState(defaultValues?.authors ?? "")
  const [isbn, setIsbn] = useState(defaultValues?.isbn ?? "")
  const [description, setDescription] = useState(defaultValues?.description ?? "")
  const [coverUrl, setCoverUrl] = useState(defaultValues?.coverUrl ?? "")

  const [suggestions, setSuggestions] = useState<BookSuggestion[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [lookupError, setLookupError] = useState<string | null>(null)

  useEffect(() => {
    if (title.length < 2) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }
    const timer = setTimeout(async () => {
      setIsSearching(true)
      setSearchError(null)
      try {
        const results = await searchByTitle(title)
        setSuggestions(results)
        setShowDropdown(true)
      } catch {
        setSearchError("Search failed")
        setSuggestions([])
      } finally {
        setIsSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [title])

  function handleSelect(suggestion: BookSuggestion) {
    setTitle(suggestion.title)
    setAuthors(suggestion.authors)
    setIsbn(suggestion.isbn)
    setCoverUrl(suggestion.coverUrl ?? "")
    setDescription(suggestion.description ?? "")
    setShowDropdown(false)
    setSuggestions([])
  }

  async function handleIsbnLookup() {
    if (!isbn) return
    setIsLookingUp(true)
    setLookupError(null)
    try {
      const result = await lookupByIsbn(isbn)
      if (!result) {
        setLookupError("No book found for this ISBN")
        return
      }
      setTitle(result.title)
      setAuthors(result.authors)
      setCoverUrl(result.coverUrl ?? "")
      setDescription(result.description ?? "")
    } catch {
      setLookupError("Lookup failed")
    } finally {
      setIsLookingUp(false)
    }
  }

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

      <div className="relative flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700" htmlFor="title">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          name="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500"
        />
        {searchError && (
          <p className="text-xs text-red-600">{searchError}</p>
        )}
        {(showDropdown || isSearching) && (
          <BookSearchDropdown
            suggestions={suggestions}
            isSearching={isSearching}
            onSelect={handleSelect}
            onClose={() => setShowDropdown(false)}
          />
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700" htmlFor="authors">
          Author(s)
        </label>
        <input
          id="authors"
          name="authors"
          value={authors}
          onChange={(e) => setAuthors(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700" htmlFor="isbn">
          ISBN
        </label>
        <div className="flex gap-2">
          <input
            id="isbn"
            name="isbn"
            value={isbn}
            onChange={(e) => setIsbn(e.target.value)}
            onBlur={handleIsbnLookup}
            className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500"
          />
          <button
            type="button"
            onClick={handleIsbnLookup}
            disabled={isLookingUp || !isbn}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            {isLookingUp ? "Looking up…" : "Lookup"}
          </button>
        </div>
        {lookupError && (
          <p className="text-xs text-red-600">{lookupError}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500"
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
          value={coverUrl}
          onChange={(e) => setCoverUrl(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500"
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

Expected: no errors

- [ ] **Step 3: Run full test suite**

```bash
cd apps/web && npx vitest run
```

Expected: all tests pass

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/books/book-form.tsx
git commit -m "feat: add ISBN lookup and title autocomplete to book form"
```
