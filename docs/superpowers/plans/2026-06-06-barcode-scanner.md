# Barcode Scanner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Scan" button to the book form that reads an ISBN barcode with the device camera and auto-runs the existing Open Library lookup.

**Architecture:** A self-contained client component captures a barcode via `@zxing/browser` and reports the decoded string. A pure helper normalizes/validates the ISBN. The book form wires the scanned code into a shared `runLookup` path used by both the existing "Lookup" button and the scanner.

**Tech Stack:** React 19, Next.js 16 App Router, Tailwind CSS v4, `@zxing/browser`, Vitest.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `apps/web/package.json` | Add `@zxing/browser` dependency |
| Create | `apps/web/lib/isbn.ts` | Pure ISBN normalization/validation |
| Test | `apps/web/__tests__/lib/isbn.test.ts` | Unit tests for `normalizeIsbn` |
| Create | `apps/web/components/books/barcode-scanner.tsx` | Camera modal that decodes a barcode |
| Modify | `apps/web/components/books/book-form.tsx` | "Scan" button + shared `runLookup` + scanned-code handling |

All commands run from the repo root `/home/devin/dev/My-Shelf` unless noted.

---

## Task 1: ISBN Normalization Helper

**Files:**
- Create: `apps/web/lib/isbn.ts`
- Test: `apps/web/__tests__/lib/isbn.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `apps/web/__tests__/lib/isbn.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { normalizeIsbn } from "@/lib/isbn"

describe("normalizeIsbn", () => {
  it("strips hyphens from an ISBN-13", () => {
    expect(normalizeIsbn("978-0-394-80001-1")).toBe("9780394800011")
  })

  it("strips spaces from an ISBN-13", () => {
    expect(normalizeIsbn("9780 3948 0001 1")).toBe("9780394800011")
  })

  it("accepts a plain ISBN-10", () => {
    expect(normalizeIsbn("0306406152")).toBe("0306406152")
  })

  it("accepts an ISBN-10 ending in X", () => {
    expect(normalizeIsbn("080442957X")).toBe("080442957X")
  })

  it("uppercases a trailing x in an ISBN-10", () => {
    expect(normalizeIsbn("080442957x")).toBe("080442957X")
  })

  it("returns null for too-short input", () => {
    expect(normalizeIsbn("12345")).toBeNull()
  })

  it("returns null for non-numeric input", () => {
    expect(normalizeIsbn("abcdefghij")).toBeNull()
  })

  it("returns null for empty input", () => {
    expect(normalizeIsbn("")).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/web && npx vitest run __tests__/lib/isbn.test.ts`
Expected: FAIL — cannot find module `@/lib/isbn`.

- [ ] **Step 3: Implement the helper**

Create `apps/web/lib/isbn.ts`:

```ts
/**
 * Normalize a raw scanned/typed ISBN: strip spaces and hyphens, then validate
 * it is a 10- or 13-digit ISBN. ISBN-10 may end in a check character "X".
 * Returns the cleaned string, or null if it is not a valid ISBN shape.
 */
export function normalizeIsbn(raw: string): string | null {
  const cleaned = raw.replace(/[\s-]/g, "").toUpperCase()
  if (/^\d{13}$/.test(cleaned)) return cleaned
  if (/^\d{9}[\dX]$/.test(cleaned)) return cleaned
  return null
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/web && npx vitest run __tests__/lib/isbn.test.ts`
Expected: PASS — 8 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/isbn.ts apps/web/__tests__/lib/isbn.test.ts
git commit -m "feat: add ISBN normalization helper"
```

---

## Task 2: Barcode Scanner Component

**Files:**
- Modify: `apps/web/package.json` (via npm install)
- Create: `apps/web/components/books/barcode-scanner.tsx`

- [ ] **Step 1: Install the decoding library**

Run from repo root:

```bash
npm install @zxing/browser@^0.2.0 --workspace=apps/web --legacy-peer-deps
```

`--legacy-peer-deps` is required for this repo (Expo peer deps). `@zxing/browser` pulls in `@zxing/library` automatically.

Expected: `@zxing/browser` appears under `dependencies` in `apps/web/package.json`.

- [ ] **Step 2: Create the scanner component**

Create `apps/web/components/books/barcode-scanner.tsx`:

```tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser"

interface BarcodeScannerProps {
  onDetected: (code: string) => void
  onClose: () => void
}

export function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const onDetectedRef = useRef(onDetected)
  onDetectedRef.current = onDetected

  const [error, setError] = useState<string | null>(null)

  // Start the camera once on mount; refs keep this effect from re-running when
  // the parent re-creates the onDetected callback.
  useEffect(() => {
    const reader = new BrowserMultiFormatReader()
    let controls: IScannerControls | null = null
    let cancelled = false

    reader
      .decodeFromConstraints(
        { video: { facingMode: "environment" } },
        videoRef.current!,
        (result, _err, ctrl) => {
          if (cancelled) return
          if (result) {
            ctrl.stop()
            onDetectedRef.current(result.getText())
          }
        }
      )
      .then((ctrl) => {
        controls = ctrl
        if (cancelled) ctrl.stop()
      })
      .catch(() => {
        setError("Unable to access camera. Check permissions and try again.")
      })

    return () => {
      cancelled = true
      controls?.stop()
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 p-4">
      {error ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-white">{error}</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-white px-5 py-2 text-sm font-medium text-zinc-900"
          >
            Close
          </button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            className="max-h-[70vh] w-full max-w-md rounded-lg object-cover"
            muted
            playsInline
          />
          <p className="mt-4 text-sm text-white">
            Point the camera at the book&apos;s barcode
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 rounded-lg bg-white px-5 py-2 text-sm font-medium text-zinc-900"
          >
            Cancel
          </button>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Type-check**

Run: `cd apps/web && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/package.json apps/web/package-lock.json apps/web/components/books/barcode-scanner.tsx
git commit -m "feat: add camera barcode scanner component"
```

Note: `package-lock.json` may live at the repo root instead of `apps/web/`. Stage whichever lockfile changed (`git add -A` the lockfile path shown by `git status`).

---

## Task 3: Wire the Scanner into the Book Form

**Files:**
- Modify: `apps/web/components/books/book-form.tsx`

The current form (for reference) has an `isbn` state, an `isLookingUp` state, a `lookupError` state, and a `handleIsbnLookup` function. This task extracts the lookup body into `runLookup(code)`, adds scanner state, adds a "Scan" button, and renders the scanner.

- [ ] **Step 1: Add imports**

In `apps/web/components/books/book-form.tsx`, the existing import block is:

```tsx
import { useActionState, useState, useEffect } from "react"
import { searchByTitle, lookupByIsbn } from "@/lib/open-library"
import type { BookSuggestion } from "@/lib/open-library"
import { BookSearchDropdown } from "./book-search-dropdown"
```

Replace it with:

```tsx
import { useActionState, useState, useEffect } from "react"
import { searchByTitle, lookupByIsbn } from "@/lib/open-library"
import type { BookSuggestion } from "@/lib/open-library"
import { normalizeIsbn } from "@/lib/isbn"
import { BookSearchDropdown } from "./book-search-dropdown"
import { BarcodeScanner } from "./barcode-scanner"
```

- [ ] **Step 2: Add scanner visibility state**

Find this line:

```tsx
  const [lookupError, setLookupError] = useState<string | null>(null)
```

Add immediately after it:

```tsx
  const [showScanner, setShowScanner] = useState(false)
```

- [ ] **Step 3: Replace `handleIsbnLookup` with a shared `runLookup` plus handlers**

Replace the entire existing function:

```tsx
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
```

With:

```tsx
  async function runLookup(code: string) {
    setIsLookingUp(true)
    setLookupError(null)
    try {
      const result = await lookupByIsbn(code)
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

  function handleIsbnLookup() {
    if (!isbn) return
    runLookup(isbn)
  }

  function handleScanned(code: string) {
    setShowScanner(false)
    const normalized = normalizeIsbn(code)
    if (!normalized) {
      setLookupError("No book found for this ISBN")
      return
    }
    setIsbn(normalized)
    runLookup(normalized)
  }
```

- [ ] **Step 4: Add the "Scan" button next to "Lookup"**

Find the existing Lookup button:

```tsx
          <button
            type="button"
            onClick={handleIsbnLookup}
            disabled={isLookingUp || !isbn}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            {isLookingUp ? "Looking up…" : "Lookup"}
          </button>
```

Add this button immediately after it (still inside the same `<div className="flex gap-2">`):

```tsx
          <button
            type="button"
            onClick={() => setShowScanner(true)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            Scan
          </button>
```

- [ ] **Step 5: Render the scanner modal**

Find the closing `</form>` tag at the end of the component's returned JSX. Immediately before `</form>`, add:

```tsx
      {showScanner && (
        <BarcodeScanner
          onDetected={handleScanned}
          onClose={() => setShowScanner(false)}
        />
      )}
```

- [ ] **Step 6: Type-check and run the full test suite**

Run: `cd apps/web && npx tsc --noEmit && npx vitest run`
Expected: no type errors; all tests pass (35 existing + 8 new = 43).

- [ ] **Step 7: Commit**

```bash
git add apps/web/components/books/book-form.tsx
git commit -m "feat: wire barcode scanner into book form with auto-lookup"
```

---

## Manual Verification (after all tasks)

The camera/zxing decode flow needs real hardware. On a phone via the HTTPS tunnel:

1. Go to Add Book → tap "Scan" → grant camera permission → camera preview appears.
2. Point at a book's ISBN barcode → modal closes, ISBN fills, form auto-populates (title/authors/cover/description).
3. Tap "Scan" then "Cancel" → modal closes, camera light turns off (stream released).
4. Deny camera permission → modal shows the error message with a Close button.
