# Hearthshelf Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand the My-Shelf web app as **Hearthshelf** with a warm literary design system, refined components, and new UX features (dashboard, toasts, user menu, cover grid view, landing page) per the approved spec at `docs/superpowers/specs/2026-06-10-hearthshelf-polish-design.md`.

**Architecture:** Semantic color tokens in Tailwind v4 `@theme` so the whole app is themed from `globals.css`; shared UI primitives (`components/ui/`) for buttons/badges/empty states/page headers; new features hand-built in the codebase's existing style. Only new dependency: `sonner`.

**Tech Stack:** Next.js 16 App Router, Tailwind v4, Drizzle, Auth.js v5, next-themes, sonner, Vitest, Playwright.

---

## Conventions used by every task

### Working directory

All `npx tsc --noEmit` / `npm run lint` / `npm run test` commands run from `apps/web/`. Git commands run from the repo root.

### One design-token vocabulary

Defined in Task 1. Tailwind classes generated from them: `bg-canvas`, `bg-surface`, `bg-surface-raised`, `text-ink`, `text-ink-muted`, `text-ink-faint`, `border-edge`, `divide-edge`, `bg-accent`, `text-accent`, `text-accent-contrast`, `hover:bg-accent-hover`, `ring-accent`, `bg-accent-soft`, `font-display`.

### The classname mapping (used by all sweep tasks 3–7)

Replace every occurrence of the left column with the right column. The dark: halves disappear because the tokens flip themselves via the `.dark` block in `globals.css`.

| Current classes | Replacement |
|---|---|
| `bg-zinc-50 dark:bg-zinc-950` (page bg) | `bg-canvas` |
| `bg-white dark:bg-zinc-900` (cards, nav, inputs) | `bg-surface` |
| `bg-zinc-100 dark:bg-zinc-800` (placeholders, active nav) | `bg-surface-raised` |
| `hover:bg-zinc-50 dark:hover:bg-zinc-800` (and `hover:bg-zinc-50 ... dark:hover:bg-zinc-800` split around other classes) | `hover:bg-surface-raised` |
| `text-zinc-900 dark:text-zinc-100` | `text-ink` |
| `text-zinc-700 dark:text-zinc-300` (labels, secondary-button text) | `text-ink` |
| `text-zinc-600 dark:text-zinc-300` (body copy) | `text-ink-muted` |
| `text-zinc-500 dark:text-zinc-400` | `text-ink-muted` |
| `text-zinc-400 dark:text-zinc-500`, `text-zinc-400 dark:text-zinc-400` | `text-ink-faint` |
| `hover:text-zinc-900 dark:hover:text-zinc-100`, `hover:text-zinc-700 dark:hover:text-zinc-300` | `hover:text-ink` |
| `border-zinc-200 dark:border-zinc-800`, `border-zinc-300 dark:border-zinc-700` | `border-edge` |
| `divide-zinc-100 dark:divide-zinc-800` | `divide-edge` |
| `text-zinc-400 dark:text-zinc-500` (sidebar heading) | `text-ink-faint` |
| `focus:ring-zinc-500 dark:focus:ring-zinc-400` | `focus:ring-accent` |
| Primary button: `bg-zinc-900 px-? py-? text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300` | use `btnPrimary` from `components/ui/classes.ts` (Task 2) |
| Secondary button: `border border-zinc-300 px-? py-? text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800` | use `btnSecondary` (or `btnSecondarySm` for the small `px-3 py-1/1.5 text-xs/sm` variants) |
| Inputs/textareas/selects: `rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-zinc-400` | use `inputClass` |
| Card shells: `rounded-xl border border-zinc-200 bg-white ... dark:border-zinc-800 dark:bg-zinc-900` | `rounded-xl border border-edge bg-surface shadow-sm ...` |
| Page `h1`/`h2` titles: `text-2xl font-semibold text-zinc-900 dark:text-zinc-100` | use `PageHeader` component, or `font-display text-2xl font-semibold text-ink` where PageHeader doesn't fit |

After each sweep task, grep the touched files for `zinc` — there should be zero hits except in files outside that task's scope.

### Verification loop (every task ends with this)

```bash
cd apps/web && npx tsc --noEmit && npm run lint && npm run test
```
Expected: no type errors, no lint errors, all unit tests pass.

---

### Task 1: Design tokens, fonts, brand glyph, metadata

**Files:**
- Modify: `apps/web/app/globals.css`
- Modify: `apps/web/app/layout.tsx`
- Create: `apps/web/components/brand.tsx`
- Create: `apps/web/app/icon.svg`
- Delete: `apps/web/app/favicon.ico`

- [ ] **Step 1: Replace `apps/web/app/globals.css` with the token system**

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

:root {
  --canvas: #faf6f0;
  --surface: #fffdfa;
  --surface-raised: #f3ecdf;
  --ink: #2b211b;
  --ink-muted: #6b5d52;
  --ink-faint: #a3917f;
  --edge: #e8e0d4;
  --accent: #b4530a;
  --accent-hover: #93430a;
  --accent-contrast: #ffffff;
  --accent-soft: #f7e8d8;
}

.dark {
  --canvas: #161210;
  --surface: #211b16;
  --surface-raised: #2c241d;
  --ink: #f2ece3;
  --ink-muted: #b3a394;
  --ink-faint: #8a7a68;
  --edge: #372e26;
  --accent: #e08a3c;
  --accent-hover: #eda05c;
  --accent-contrast: #231405;
  --accent-soft: #3a2a1a;
}

@theme inline {
  --color-canvas: var(--canvas);
  --color-surface: var(--surface);
  --color-surface-raised: var(--surface-raised);
  --color-ink: var(--ink);
  --color-ink-muted: var(--ink-muted);
  --color-ink-faint: var(--ink-faint);
  --color-edge: var(--edge);
  --color-accent: var(--accent);
  --color-accent-hover: var(--accent-hover);
  --color-accent-contrast: var(--accent-contrast);
  --color-accent-soft: var(--accent-soft);
  --font-sans: var(--font-geist-sans);
  --font-display: var(--font-fraunces);
}

body {
  background: var(--canvas);
  color: var(--ink);
  font-family: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
}

/* Nav visibility — unlayered so it wins over @layer utilities */
.nav-desktop { display: none; }
@media (min-width: 768px) { .nav-desktop { display: flex; } }

.nav-mobile { display: flex; }
@media (min-width: 768px) { .nav-mobile { display: none; } }
```

- [ ] **Step 2: Update `apps/web/app/layout.tsx` — Fraunces + Hearthshelf metadata**

```tsx
import type { Metadata, Viewport } from "next"
import { Geist, Fraunces } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], axes: ["opsz"] })

export const metadata: Metadata = {
  title: "Hearthshelf",
  description: "Your home library, kept warm. Track your books and who has them.",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geist.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Create `apps/web/components/brand.tsx`**

```tsx
export function HearthGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 3.5c2 2.2 3.75 4 3.75 6.75a3.75 3.75 0 1 1-7.5 0C8.25 7.5 10 5.7 12 3.5z"
        fill="currentColor"
      />
      <path
        d="M4 17.5h16M6.5 17.5V20.5M17.5 17.5V20.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <HearthGlyph className="h-5 w-5 text-accent" />
      <span className="font-display text-lg font-semibold tracking-tight text-ink">
        Hearthshelf
      </span>
    </span>
  )
}
```

- [ ] **Step 4: Create `apps/web/app/icon.svg` and delete `apps/web/app/favicon.ico`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
  <rect width="24" height="24" rx="5" fill="#faf6f0"/>
  <path d="M12 3.5c2 2.2 3.75 4 3.75 6.75a3.75 3.75 0 1 1-7.5 0C8.25 7.5 10 5.7 12 3.5z" fill="#b4530a"/>
  <path d="M4 17.5h16M6.5 17.5V20.5M17.5 17.5V20.5" stroke="#b4530a" stroke-width="1.8" stroke-linecap="round"/>
</svg>
```

```bash
rm apps/web/app/favicon.ico
```

- [ ] **Step 5: Verify**

Run the verification loop. Then `npm run dev` and load `/` — page background should be warm cream; no Arial anywhere (inspect body computed font = Geist).

- [ ] **Step 6: Commit**

```bash
git add -A apps/web/app apps/web/components/brand.tsx
git commit -m "feat: Hearthshelf design tokens, Fraunces display font, brand glyph"
```

---

### Task 2: Shared UI primitives

**Files:**
- Create: `apps/web/components/ui/classes.ts`
- Create: `apps/web/components/ui/status-badge.tsx`
- Create: `apps/web/components/ui/empty-state.tsx`
- Create: `apps/web/components/ui/page-header.tsx`
- Test: `apps/web/__tests__/components/status-badge.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { StatusBadge } from "@/components/ui/status-badge"

describe("StatusBadge", () => {
  it("renders the label for each status", () => {
    const { rerender } = render(<StatusBadge status="available" />)
    expect(screen.getByText("Available")).toBeInTheDocument()
    rerender(<StatusBadge status="checked-out" />)
    expect(screen.getByText("Checked out")).toBeInTheDocument()
    rerender(<StatusBadge status="overdue" />)
    expect(screen.getByText("Overdue")).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it — expect FAIL (module not found)**

```bash
cd apps/web && npx vitest run __tests__/components/status-badge.test.tsx
```

- [ ] **Step 3: Create `components/ui/classes.ts`**

```ts
// Shared button/input recipes so every page renders identical controls.
const btnBase =
  "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:opacity-50"

export const btnPrimary = `${btnBase} bg-accent px-4 py-2 text-accent-contrast shadow-sm hover:bg-accent-hover`
export const btnSecondary = `${btnBase} border border-edge bg-surface px-4 py-2 text-ink shadow-sm hover:bg-surface-raised`
export const btnSecondarySm = `${btnBase} border border-edge bg-surface px-3 py-1.5 text-xs text-ink hover:bg-surface-raised`
export const btnDanger = `${btnBase} border border-red-300 px-4 py-2 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40`

export const inputClass =
  "rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent"

export const labelClass = "text-sm font-medium text-ink"
```

- [ ] **Step 4: Create `components/ui/status-badge.tsx`**

```tsx
type Status = "available" | "checked-out" | "overdue"

const styles: Record<Status, string> = {
  available: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
  "checked-out": "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  overdue: "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300",
}

const dots: Record<Status, string> = {
  available: "bg-emerald-500",
  "checked-out": "bg-amber-500",
  overdue: "bg-red-500",
}

const labels: Record<Status, string> = {
  available: "Available",
  "checked-out": "Checked out",
  overdue: "Overdue",
}

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${dots[status]}`} />
      {labels[status]}
    </span>
  )
}
```

- [ ] **Step 5: Create `components/ui/empty-state.tsx`**

```tsx
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-edge bg-surface px-6 py-16 text-center">
      <span className="text-ink-faint [&>svg]:h-10 [&>svg]:w-10">{icon}</span>
      <div>
        <p className="font-display text-lg font-semibold text-ink">{title}</p>
        <p className="mt-1 text-sm text-ink-muted">{description}</p>
      </div>
      {action && <div className="mt-2 flex items-center gap-2">{action}</div>}
    </div>
  )
}
```

- [ ] **Step 6: Create `components/ui/page-header.tsx`**

```tsx
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
```

- [ ] **Step 7: Run the test — expect PASS, then full verification loop**

- [ ] **Step 8: Commit**

```bash
git add apps/web/components/ui apps/web/__tests__/components/status-badge.test.tsx
git commit -m "feat: shared UI primitives (button recipes, badge, empty state, page header)"
```

---

### Task 3: Nav + library layout sweep

**Files:**
- Modify: `apps/web/components/nav.tsx`
- Modify: `apps/web/app/(library)/layout.tsx`
- Modify: `apps/web/components/theme-toggle.tsx`

(The user menu comes later in Task 11 — this task only re-skins what exists.)

- [ ] **Step 1: Update `components/nav.tsx`**

Replace the desktop sidebar's "Library" heading block (the `<p aria-hidden…>Library</p>`) with the wordmark:

```tsx
import { Wordmark } from "@/components/brand"
```

```tsx
<div className="mb-6 px-2">
  <Wordmark />
</div>
```

Sidebar `<nav>` classes become:

```
nav-desktop w-52 flex-col gap-1 border-r border-edge bg-surface px-3 py-6
```

Each sidebar link gets an accent active state with a left indicator bar (note `relative`):

```tsx
className={`relative rounded-md px-3 py-2 text-sm font-medium transition-colors ${
  isActive
    ? "bg-accent-soft text-accent before:absolute before:left-0 before:top-1/2 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-accent"
    : "text-ink-muted hover:bg-surface-raised hover:text-ink"
}`}
```

Mobile tab bar `<nav>` classes:

```
nav-mobile fixed bottom-0 left-0 right-0 z-50 h-14 border-t border-edge bg-surface
```

Mobile link classes:

```tsx
className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors ${
  isActive ? "text-accent" : "text-ink-faint"
}`}
```

Sidebar sign-out button and mobile sign-out button: apply the mapping table (`text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:…` → `text-ink-muted hover:bg-surface-raised hover:text-ink`; mobile `text-zinc-400 … hover:text-zinc-900 dark:…` → `text-ink-faint hover:text-ink`).

- [ ] **Step 2: Update `app/(library)/layout.tsx` content wrapper**

```tsx
<div className="flex-1 overflow-y-auto bg-canvas p-4 pb-20 md:p-8">{children}</div>
```

- [ ] **Step 3: Update `components/theme-toggle.tsx` class strings**

```ts
const sidebarClass =
  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-ink-muted hover:bg-surface-raised hover:text-ink"
const tabClass =
  "flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium text-ink-faint transition-colors hover:text-ink"
```

- [ ] **Step 4: Verify**

Verification loop; `grep -n zinc components/nav.tsx components/theme-toggle.tsx "app/(library)/layout.tsx"` → no hits. Visual check sidebar + mobile (resize) in light & dark.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/nav.tsx apps/web/components/theme-toggle.tsx "apps/web/app/(library)/layout.tsx"
git commit -m "feat: restyle nav and library layout with Hearthshelf tokens and wordmark"
```

---

### Task 4: Books pages sweep

**Files:**
- Modify: `apps/web/app/(library)/books/page.tsx`
- Modify: `apps/web/components/books/books-list.tsx`
- Modify: `apps/web/app/(library)/books/[id]/page.tsx`
- Modify: `apps/web/app/(library)/books/new/page.tsx`
- Modify: `apps/web/app/(library)/books/[id]/edit/page.tsx`
- Modify: `apps/web/app/(library)/books/import/page.tsx`
- Modify: `apps/web/app/(library)/books/bulk-edit/page.tsx`
- Modify: `apps/web/components/books/book-bulk-edit.tsx`

- [ ] **Step 1: `books/page.tsx` — use `PageHeader` + button recipes**

```tsx
import Link from "next/link"
import { auth } from "@/auth"
import { getBooksForUser } from "@/lib/queries/books"
import { BooksList } from "@/components/books/books-list"
import { PageHeader } from "@/components/ui/page-header"
import { btnPrimary, btnSecondary } from "@/components/ui/classes"

export default async function BooksPage() {
  const session = await auth()
  const books = await getBooksForUser(session!.user!.id!)

  return (
    <div>
      <PageHeader
        title="My Library"
        subtitle={`${books.length} ${books.length === 1 ? "book" : "books"}`}
        actions={
          <>
            <Link href="/books/bulk-edit" className={btnSecondary}>Bulk edit</Link>
            <Link href="/books/import" className={btnSecondary}>Import CSV</Link>
            <Link href="/books/new" className={btnPrimary}>Add Book</Link>
          </>
        }
      />
      <BooksList books={books} />
    </div>
  )
}
```

- [ ] **Step 2: `components/books/books-list.tsx` — tokens, StatusBadge, EmptyState, cover fallback glyph**

(The grid toggle comes in Task 12; this step only re-skins.) Apply:
- search input → `inputClass` (import from `@/components/ui/classes`), keep `w-full max-w-sm`.
- list shell → `divide-y divide-edge rounded-xl border border-edge bg-surface shadow-sm`.
- row hover → `hover:bg-surface-raised`; title `text-ink`; authors `text-ink-muted`.
- status span → `<StatusBadge status={book.isCheckedOut ? "checked-out" : "available"} />`.
- "Check Out" link → `btnSecondarySm`.
- cover image gets `border border-edge`; the no-cover `<div>` becomes:

```tsx
<div className="flex h-14 w-10 flex-shrink-0 items-center justify-center rounded border border-edge bg-surface-raised">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5 text-ink-faint" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
  </svg>
</div>
```

- empty states (replace the bare `<p>`):

```tsx
import { EmptyState } from "@/components/ui/empty-state"
import { btnPrimary } from "@/components/ui/classes"
```

```tsx
{filtered.length === 0 ? (
  query ? (
    <EmptyState
      icon={bookIcon}
      title="No matches"
      description={`Nothing on your shelf matches “${query}”.`}
    />
  ) : (
    <EmptyState
      icon={bookIcon}
      title="Your shelf is empty"
      description="Add your first book to start tracking your library."
      action={<Link href="/books/new" className={btnPrimary}>Add Book</Link>}
    />
  )
) : ( /* existing list */ )}
```

where `bookIcon` is a module-level const holding the same book SVG as the cover fallback (without size classes — EmptyState sizes it).

- [ ] **Step 3: `books/[id]/page.tsx` — tokens + badge**

Apply the mapping table. Specifics: back link → `text-sm text-ink-muted hover:text-ink`; card → `rounded-xl border border-edge bg-surface p-6 shadow-sm`; title h1 → `font-display text-2xl font-semibold text-ink`; "Check Out" → `btnPrimary`; "Edit" → `btnSecondary`; cover img add `border border-edge`. Add a `<StatusBadge status={book.isCheckedOut ? "checked-out" : "available"} />` right under the authors line (wrap in `<div className="mt-2">`).

- [ ] **Step 4: `books/new`, `books/[id]/edit`, `books/import`, `books/bulk-edit` pages + `book-bulk-edit.tsx`**

Open each file and apply the mapping table mechanically (headings → `font-display text-2xl font-semibold text-ink` or `PageHeader` where the page already has a title+actions row; buttons → recipes; inputs → `inputClass`; cards/tables → `border-edge bg-surface`). No structural changes.

- [ ] **Step 5: Verify**

Verification loop. `grep -rn zinc "apps/web/app/(library)/books" apps/web/components/books/books-list.tsx apps/web/components/books/book-bulk-edit.tsx` → no hits. Visual check: /books (with and without data), a book detail, /books/new, /books/bulk-edit, /books/import in light + dark.

- [ ] **Step 6: Commit**

```bash
git add "apps/web/app/(library)/books" apps/web/components/books/books-list.tsx apps/web/components/books/book-bulk-edit.tsx
git commit -m "feat: restyle books pages with tokens, badges, and empty states"
```

---

### Task 5: Contacts pages sweep

**Files:**
- Modify: `apps/web/app/(library)/contacts/page.tsx`
- Modify: `apps/web/app/(library)/contacts/[id]/page.tsx`
- Modify: `apps/web/app/(library)/contacts/new/page.tsx`
- Modify: `apps/web/app/(library)/contacts/[id]/edit/page.tsx`
- Modify: `apps/web/app/(library)/contacts/import/page.tsx`

- [ ] **Step 1: `contacts/page.tsx`**

Same pattern as Task 4 Step 1: `PageHeader` with title "Contacts", subtitle `${contacts.length} …`, actions = Import CSV (`btnSecondary`) + Add Contact (`btnPrimary`). List shell/rows per mapping table. Empty state:

```tsx
<EmptyState
  icon={personIcon}
  title="No contacts yet"
  description="Add the people you lend books to."
  action={<Link href="/contacts/new" className={btnPrimary}>Add Contact</Link>}
/>
```

`personIcon` = the contacts SVG path already used in `components/nav.tsx` (copy the `<svg>` without size classes).

- [ ] **Step 2: Remaining contacts pages**

Apply the mapping table to `[id]/page.tsx`, `new/page.tsx`, `[id]/edit/page.tsx`, `import/page.tsx` (headings, buttons, cards, links — same recipes as Task 4 Step 4).

- [ ] **Step 3: Verify**

Verification loop; `grep -rn zinc "apps/web/app/(library)/contacts"` → no hits. Visual check each page in light + dark.

- [ ] **Step 4: Commit**

```bash
git add "apps/web/app/(library)/contacts"
git commit -m "feat: restyle contacts pages with tokens and empty states"
```

---

### Task 6: Checkouts pages sweep

**Files:**
- Modify: `apps/web/app/(library)/checkouts/page.tsx`
- Modify: `apps/web/app/(library)/checkouts/new/page.tsx`

- [ ] **Step 1: `checkouts/page.tsx`**

- Header → `PageHeader` (title "Active Checkouts", actions = Check Out a Book `btnPrimary`).
- Cards → `rounded-xl border border-edge bg-surface px-5 py-4 shadow-sm`; text per mapping table; "Mark Returned" → `btnSecondarySm`.
- Overdue flag: where the due date renders, mark overdue in red:

```tsx
<p className="text-xs text-ink-faint">
  Since {formatDate(checkout.checkedOutAt)}
  {checkout.dueDate && (
    <>
      {" · "}
      <span className={checkout.dueDate < new Date() ? "font-medium text-red-600 dark:text-red-400" : undefined}>
        Due {formatDate(checkout.dueDate)}
      </span>
    </>
  )}
</p>
```

- Empty state for no active checkouts:

```tsx
<EmptyState
  icon={arrowsIcon}
  title="Nothing checked out"
  description="All your books are home on the shelf."
  action={<Link href="/checkouts/new" className={btnPrimary}>Check Out a Book</Link>}
/>
```

`arrowsIcon` = the checkouts SVG from `components/nav.tsx`.
- History section: heading → `font-display text-lg font-semibold text-ink`; list per mapping table.

- [ ] **Step 2: `checkouts/new/page.tsx`** — apply the mapping table.

- [ ] **Step 3: Verify**

Verification loop; `grep -rn zinc "apps/web/app/(library)/checkouts"` → no hits. Visual check with/without active checkouts, light + dark.

- [ ] **Step 4: Commit**

```bash
git add "apps/web/app/(library)/checkouts"
git commit -m "feat: restyle checkouts pages with tokens, overdue flag, empty state"
```

---

### Task 7: Forms & shared components sweep

**Files:**
- Modify: `apps/web/components/books/book-form.tsx`
- Modify: `apps/web/components/books/book-search-dropdown.tsx`
- Modify: `apps/web/components/books/barcode-scanner.tsx`
- Modify: `apps/web/components/books/delete-book-form.tsx`
- Modify: `apps/web/components/contacts/contact-form.tsx`
- Modify: `apps/web/components/contacts/delete-contact-form.tsx`
- Modify: `apps/web/components/checkouts/checkout-form.tsx`
- Modify: `apps/web/components/checkouts/book-combobox.tsx`
- Modify: `apps/web/components/csv-import.tsx`

- [ ] **Step 1: Sweep each file with the mapping table**

In every file: labels → `labelClass`, inputs/textareas/selects → `inputClass` (keep layout additions like `flex-1`), primary submits → `btnPrimary` (keep `self-start`), secondary buttons (Lookup, Scan, Cancel) → `btnSecondary`, delete buttons → `btnDanger`, dropdown/popover panels → `border-edge bg-surface shadow-md`, text colors per table. Error blocks (`bg-red-50 …`) stay as they are.

Existing component tests (`contact-form.test.tsx`, `csv-import.test.tsx`) assert behavior/labels, not classnames — they must still pass unchanged.

- [ ] **Step 2: Verify**

Verification loop (includes those component tests); `grep -rn zinc apps/web/components` → no hits anywhere now. Visual check: /books/new form (search dropdown, scan modal), /contacts/new, /checkouts/new, an import page.

- [ ] **Step 3: Commit**

```bash
git add apps/web/components
git commit -m "feat: restyle forms and shared components with token recipes"
```

---

### Task 8: Dashboard queries (TDD)

**Files:**
- Create: `apps/web/lib/queries/dashboard.ts`
- Test: `apps/web/__tests__/integration/queries/dashboard.test.ts`

- [ ] **Step 1: Write the failing integration test**

```ts
import { describe, it, expect, beforeEach } from "vitest"
import { getDashboardStats, getRecentActivity } from "@/lib/queries/dashboard"
import { createBookRecordReturningId } from "@/lib/queries/books"
import { createContactRecord, getContactsForUser } from "@/lib/queries/contacts"
import { createCheckoutRecord, getActiveCheckouts, returnBookRecord } from "@/lib/queries/checkouts"
import { users } from "@/lib/db/schema"
import { db, truncateAll } from "../helpers"

const USER_ID = "itest-user"

const bookData = (title: string) => ({
  title,
  authors: null,
  isbn: null,
  description: null,
  coverUrl: null,
})

beforeEach(async () => {
  await truncateAll()
  await db.insert(users).values({ id: USER_ID, email: "itest@example.com" })
})

describe("getDashboardStats", () => {
  it("returns zeros for an empty library", async () => {
    expect(await getDashboardStats(USER_ID)).toEqual({
      totalBooks: 0,
      checkedOutNow: 0,
      overdue: 0,
      totalContacts: 0,
    })
  })

  it("counts books, active checkouts, overdue, and contacts", async () => {
    const b1 = await createBookRecordReturningId(USER_ID, bookData("Dune"))
    const b2 = await createBookRecordReturningId(USER_ID, bookData("Emma"))
    await createBookRecordReturningId(USER_ID, bookData("Ulysses"))
    await createContactRecord(USER_ID, { name: "Ada", email: null, phone: null })

    const past = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000)
    await createCheckoutRecord(USER_ID, { bookId: b1, contactId: null, dueDate: past, notes: null })
    await createCheckoutRecord(USER_ID, { bookId: b2, contactId: null, dueDate: future, notes: null })

    expect(await getDashboardStats(USER_ID)).toEqual({
      totalBooks: 3,
      checkedOutNow: 2,
      overdue: 1,
      totalContacts: 1,
    })
  })

  it("does not count another user's data", async () => {
    await db.insert(users).values({ id: "other", email: "other@example.com" })
    await createBookRecordReturningId("other", bookData("Hidden"))
    expect((await getDashboardStats(USER_ID)).totalBooks).toBe(0)
  })
})

describe("getRecentActivity", () => {
  it("returns checkout and return events, newest first", async () => {
    const b1 = await createBookRecordReturningId(USER_ID, bookData("Dune"))
    await createContactRecord(USER_ID, { name: "Ada", email: null, phone: null })
    const [contact] = await getContactsForUser(USER_ID)

    await createCheckoutRecord(USER_ID, { bookId: b1, contactId: contact.id, dueDate: null, notes: null })
    const [active] = await getActiveCheckouts(USER_ID)
    await returnBookRecord(active.id, USER_ID)

    const events = await getRecentActivity(USER_ID)
    expect(events).toHaveLength(2)
    expect(events[0]).toMatchObject({ type: "return", bookTitle: "Dune", contactName: "Ada" })
    expect(events[1]).toMatchObject({ type: "checkout", bookTitle: "Dune", contactName: "Ada" })
  })

  it("limits the number of events", async () => {
    for (let i = 0; i < 4; i++) {
      const id = await createBookRecordReturningId(USER_ID, bookData(`Book ${i}`))
      await createCheckoutRecord(USER_ID, { bookId: id, contactId: null, dueDate: null, notes: null })
    }
    expect(await getRecentActivity(USER_ID, 3)).toHaveLength(3)
  })
})
```

- [ ] **Step 2: Run it — expect FAIL (module not found)**

Integration tests need the test DB:

```bash
cd apps/web && npm run test:db:up && npm run db:push:test
npm run test:integration -- __tests__/integration/queries/dashboard.test.ts
```

(If `getContactsForUser` is named differently in `lib/queries/contacts.ts`, check that file and use its actual list function.)

- [ ] **Step 3: Implement `lib/queries/dashboard.ts`**

```ts
import { db } from "@/lib/db"
import { books, checkouts, contacts } from "@/lib/db/schema"
import { and, count, desc, eq, isNull, lt, sql } from "drizzle-orm"

export type DashboardStats = {
  totalBooks: number
  checkedOutNow: number
  overdue: number
  totalContacts: number
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const [[bookCount], [activeCount], [overdueCount], [contactCount]] = await Promise.all([
    db.select({ value: count() }).from(books).where(eq(books.userId, userId)),
    db
      .select({ value: count() })
      .from(checkouts)
      .where(and(eq(checkouts.userId, userId), isNull(checkouts.returnedAt))),
    db
      .select({ value: count() })
      .from(checkouts)
      .where(
        and(
          eq(checkouts.userId, userId),
          isNull(checkouts.returnedAt),
          lt(checkouts.dueDate, new Date())
        )
      ),
    db.select({ value: count() }).from(contacts).where(eq(contacts.userId, userId)),
  ])

  return {
    totalBooks: bookCount.value,
    checkedOutNow: activeCount.value,
    overdue: overdueCount.value,
    totalContacts: contactCount.value,
  }
}

export type ActivityEvent = {
  checkoutId: string
  type: "checkout" | "return"
  bookId: string
  bookTitle: string
  contactName: string | null
  at: Date
}

export async function getRecentActivity(userId: string, limit = 5): Promise<ActivityEvent[]> {
  // Order by the latest event on each checkout (return beats checkout when present)
  // so old checkouts that were just returned still surface.
  const rows = await db
    .select({
      id: checkouts.id,
      checkedOutAt: checkouts.checkedOutAt,
      returnedAt: checkouts.returnedAt,
      bookId: books.id,
      bookTitle: books.title,
      contactName: contacts.name,
    })
    .from(checkouts)
    .innerJoin(books, eq(checkouts.bookId, books.id))
    .leftJoin(contacts, eq(checkouts.contactId, contacts.id))
    .where(eq(checkouts.userId, userId))
    .orderBy(desc(sql`COALESCE(${checkouts.returnedAt}, ${checkouts.checkedOutAt})`))
    .limit(limit)

  const events: ActivityEvent[] = []
  for (const r of rows) {
    events.push({
      checkoutId: r.id,
      type: "checkout",
      bookId: r.bookId,
      bookTitle: r.bookTitle,
      contactName: r.contactName,
      at: r.checkedOutAt,
    })
    if (r.returnedAt) {
      events.push({
        checkoutId: r.id,
        type: "return",
        bookId: r.bookId,
        bookTitle: r.bookTitle,
        contactName: r.contactName,
        at: r.returnedAt,
      })
    }
  }
  return events.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit)
}
```

- [ ] **Step 4: Run the integration test — expect PASS. Then the verification loop.**

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/queries/dashboard.ts apps/web/__tests__/integration/queries/dashboard.test.ts
git commit -m "feat: dashboard stats and recent-activity queries with integration tests"
```

---

### Task 9: Dashboard page + Home nav + redirect changes

**Files:**
- Create: `apps/web/app/(library)/dashboard/page.tsx`
- Modify: `apps/web/components/nav.tsx` (add Home link)
- Modify: `apps/web/app/page.tsx` (redirect `/books` → `/dashboard`)

- [ ] **Step 1: Create `app/(library)/dashboard/page.tsx`**

```tsx
import Link from "next/link"
import { auth } from "@/auth"
import { getDashboardStats, getRecentActivity } from "@/lib/queries/dashboard"
import { getActiveCheckouts } from "@/lib/queries/checkouts"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { btnPrimary, btnSecondary } from "@/components/ui/classes"

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(d)
}

export default async function DashboardPage() {
  const session = await auth()
  const userId = session!.user!.id!

  const [stats, activity, active] = await Promise.all([
    getDashboardStats(userId),
    getRecentActivity(userId),
    getActiveCheckouts(userId),
  ])

  const firstName = session!.user!.name?.split(" ")[0]

  if (stats.totalBooks === 0) {
    return (
      <div>
        <PageHeader title={firstName ? `Welcome, ${firstName}` : "Welcome"} />
        <EmptyState
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          }
          title="Let's stock your shelf"
          description="Add your first book by hand, or import your whole library from a CSV."
          action={
            <>
              <Link href="/books/new" className={btnPrimary}>Add Book</Link>
              <Link href="/books/import" className={btnSecondary}>Import CSV</Link>
            </>
          }
        />
      </div>
    )
  }

  const cards = [
    { label: "Books", value: stats.totalBooks, href: "/books" },
    { label: "Checked out", value: stats.checkedOutNow, href: "/checkouts" },
    { label: "Overdue", value: stats.overdue, href: "/checkouts", alert: stats.overdue > 0 },
    { label: "Contacts", value: stats.totalContacts, href: "/contacts" },
  ]

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : "Welcome back"}
        actions={
          <>
            <Link href="/books/new" className={btnSecondary}>Add Book</Link>
            <Link href="/checkouts/new" className={btnPrimary}>Check Out</Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-xl border border-edge bg-surface p-4 shadow-sm transition-colors hover:bg-surface-raised"
          >
            <p className="text-sm text-ink-muted">{card.label}</p>
            <p
              className={`font-display text-3xl font-semibold ${
                card.alert ? "text-red-600 dark:text-red-400" : "text-ink"
              }`}
            >
              {card.value}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 font-display text-lg font-semibold text-ink">Currently out</h2>
          {active.length === 0 ? (
            <p className="rounded-xl border border-dashed border-edge bg-surface px-5 py-8 text-center text-sm text-ink-muted">
              All your books are home on the shelf.
            </p>
          ) : (
            <ul className="divide-y divide-edge rounded-xl border border-edge bg-surface shadow-sm">
              {active.map((checkout) => {
                const overdue = checkout.dueDate !== null && checkout.dueDate < new Date()
                return (
                  <li key={checkout.id}>
                    <Link href={`/books/${checkout.book.id}`} className="block px-5 py-3 hover:bg-surface-raised">
                      <p className="truncate text-sm font-medium text-ink">{checkout.book.title}</p>
                      <p className="text-xs text-ink-muted">
                        {checkout.contact ? checkout.contact.name : "Yourself"}
                        {checkout.dueDate && (
                          <>
                            {" · "}
                            <span className={overdue ? "font-medium text-red-600 dark:text-red-400" : undefined}>
                              Due {formatDate(checkout.dueDate)}
                            </span>
                          </>
                        )}
                      </p>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-3 font-display text-lg font-semibold text-ink">Recent activity</h2>
          {activity.length === 0 ? (
            <p className="rounded-xl border border-dashed border-edge bg-surface px-5 py-8 text-center text-sm text-ink-muted">
              No lending activity yet.
            </p>
          ) : (
            <ul className="divide-y divide-edge rounded-xl border border-edge bg-surface shadow-sm">
              {activity.map((event) => (
                <li key={`${event.checkoutId}-${event.type}`} className="px-5 py-3">
                  <p className="text-sm text-ink">
                    <Link href={`/books/${event.bookId}`} className="font-medium hover:text-accent">
                      {event.bookTitle}
                    </Link>{" "}
                    {event.type === "checkout"
                      ? `checked out to ${event.contactName ?? "yourself"}`
                      : `returned by ${event.contactName ?? "you"}`}
                  </p>
                  <p className="text-xs text-ink-faint">{formatDate(event.at)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add Home to `components/nav.tsx`**

Prepend to the `links` array:

```tsx
{
  href: "/dashboard",
  label: "Home",
  icon: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
    </svg>
  ),
},
```

- [ ] **Step 3: Update redirects in `app/page.tsx`**

Change `if (session) redirect("/books")` → `redirect("/dashboard")`, and both `signIn(..., { redirectTo: "/books" })` → `redirectTo: "/dashboard"`.

- [ ] **Step 4: Verify**

Verification loop. Visual check `/dashboard` with data and (using a fresh user or truncated dev DB) without data; confirm signing in lands on /dashboard.

- [ ] **Step 5: Commit**

```bash
git add "apps/web/app/(library)/dashboard" apps/web/components/nav.tsx apps/web/app/page.tsx
git commit -m "feat: dashboard page with stats, activity, and Home nav"
```

---

### Task 10: Toasts (sonner + flash redirect param)

**Design note (deviation from spec, agreed rationale):** the spec said "flash cookie", but a cookie read by a layout-mounted client component misses same-path redirects (e.g. Mark Returned redirects `/checkouts` → `/checkouts`; no remount, no pathname change, toast lost). Instead actions redirect with a `?flash=` query param; a client component watches `useSearchParams`, fires the toast, and strips the param. Same UX, no cookie mocking needed in action tests.

**Files:**
- Modify: `apps/web/package.json` (add sonner)
- Create: `apps/web/components/flash-toast.tsx`
- Modify: `apps/web/app/(library)/layout.tsx`
- Modify: `apps/web/lib/actions/books.ts`
- Modify: `apps/web/lib/actions/contacts.ts`
- Modify: `apps/web/lib/actions/checkouts.ts`
- Modify: `apps/web/__tests__/actions/books.test.ts`, `__tests__/actions/contacts.test.ts`, `__tests__/actions/checkouts.test.ts` (updated redirect expectations)
- Modify: `apps/web/e2e/books.spec.ts` (URL regex)
- Test: `apps/web/__tests__/components/flash-toast.test.tsx`

- [ ] **Step 1: Install sonner**

```bash
npm install sonner --legacy-peer-deps -w @my-shelf/web
```

- [ ] **Step 2: Write the failing component test**

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render } from "@testing-library/react"

const replace = vi.fn()
let search = ""
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/books",
  useSearchParams: () => new URLSearchParams(search),
}))
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }))

import { toast } from "sonner"
import { FlashToast } from "@/components/flash-toast"

describe("FlashToast", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    search = ""
  })

  it("fires a toast and strips the flash param", () => {
    search = "flash=Book%20added"
    render(<FlashToast />)
    expect(toast.success).toHaveBeenCalledWith("Book added")
    expect(replace).toHaveBeenCalledWith("/books", { scroll: false })
  })

  it("preserves other query params when stripping", () => {
    search = "flash=Saved&view=grid"
    render(<FlashToast />)
    expect(replace).toHaveBeenCalledWith("/books?view=grid", { scroll: false })
  })

  it("does nothing without a flash param", () => {
    render(<FlashToast />)
    expect(toast.success).not.toHaveBeenCalled()
    expect(replace).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 3: Run it — expect FAIL (module not found)**

```bash
npx vitest run __tests__/components/flash-toast.test.tsx
```

- [ ] **Step 4: Create `components/flash-toast.tsx`**

```tsx
"use client"

import { useEffect } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

export function FlashToast() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const flash = searchParams.get("flash")

  useEffect(() => {
    if (!flash) return
    toast.success(flash)
    const rest = new URLSearchParams(searchParams)
    rest.delete("flash")
    const query = rest.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [flash, pathname, router, searchParams])

  return null
}
```

- [ ] **Step 5: Run the test — expect PASS**

- [ ] **Step 6: Mount Toaster + FlashToast in `app/(library)/layout.tsx`**

`useSearchParams` requires a Suspense boundary:

```tsx
import { Suspense } from "react"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Nav } from "@/components/nav"
import { Toaster } from "sonner"
import { FlashToast } from "@/components/flash-toast"

export default async function LibraryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect("/")

  return (
    <div className="flex min-h-screen">
      <Nav />
      <div className="flex-1 overflow-y-auto bg-canvas p-4 pb-20 md:p-8">{children}</div>
      <Toaster position="top-right" toastOptions={{ className: "!bg-surface !text-ink !border-edge" }} />
      <Suspense fallback={null}>
        <FlashToast />
      </Suspense>
    </div>
  )
}
```

- [ ] **Step 7: Add flash params to action redirects**

In `lib/actions/books.ts`:
- `createBook`: `redirect("/books?flash=Book added")`
- `deleteBook`: `redirect("/books?flash=Book deleted")`
- `updateBook`: `redirect(\`/books/${id}?flash=Book updated\`)`

In `lib/actions/contacts.ts`:
- `createContact`: `redirect("/contacts?flash=Contact added")`
- `deleteContact`: `redirect("/contacts?flash=Contact deleted")`
- `updateContact`: `redirect(\`/contacts/${id}?flash=Contact updated\`)`

In `lib/actions/checkouts.ts`:
- `createCheckout`: `redirect("/checkouts?flash=Book checked out")`
- `returnBook`: `redirect("/checkouts?flash=Book returned")`

- [ ] **Step 8: Update action unit tests' redirect expectations**

In `__tests__/actions/books.test.ts`: `expect(redirect).toHaveBeenCalledWith("/books?flash=Book added")` (create), `"/books?flash=Book deleted"` (delete), `"/books/book1?flash=Book updated"` (update). Mirror the same pattern for the contacts and checkouts test files (match the exact strings from Step 7).

- [ ] **Step 9: Update `e2e/books.spec.ts` URL assertion**

```ts
await expect(page).toHaveURL(/\/books(\?|$)/)
```

- [ ] **Step 10: Verify**

Verification loop. Manual check: add a book → toast "Book added" appears top-right and the URL param disappears; mark a return → toast on same-path redirect.

- [ ] **Step 11: Commit**

```bash
git add apps/web/package.json package-lock.json apps/web/components/flash-toast.tsx "apps/web/app/(library)/layout.tsx" apps/web/lib/actions apps/web/__tests__/actions apps/web/__tests__/components/flash-toast.test.tsx apps/web/e2e/books.spec.ts
git commit -m "feat: success toasts via sonner and flash redirect params"
```

---

### Task 11: User menu

**Files:**
- Create: `apps/web/components/user-menu.tsx`
- Modify: `apps/web/components/nav.tsx`
- Modify: `apps/web/app/(library)/layout.tsx`
- Modify: `apps/web/e2e/dark-mode.spec.ts`

- [ ] **Step 1: Create `components/user-menu.tsx`**

```tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { signOutAction } from "@/lib/actions/auth"
import { ThemeToggle } from "@/components/theme-toggle"

export type NavUser = { name: string | null; email: string | null; image: string | null }

function Avatar({ user, className }: { user: NavUser; className: string }) {
  if (user.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={user.image} alt="" className={`${className} rounded-full object-cover`} />
  }
  return (
    <span
      className={`${className} flex items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent`}
    >
      {(user.name ?? user.email ?? "?").slice(0, 1).toUpperCase()}
    </span>
  )
}

export function UserMenu({ user, variant }: { user: NavUser; variant: "sidebar" | "tab" }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  const menu = (
    <div
      role="menu"
      className={`absolute z-50 w-56 rounded-xl border border-edge bg-surface p-1.5 shadow-lg ${
        variant === "sidebar" ? "bottom-full left-0 mb-2" : "bottom-full right-2 mb-3"
      }`}
    >
      <div className="border-b border-edge px-3 pb-2 pt-1.5">
        <p className="truncate text-sm font-medium text-ink">{user.name ?? "Signed in"}</p>
        {user.email && <p className="truncate text-xs text-ink-muted">{user.email}</p>}
      </div>
      <div className="pt-1">
        <ThemeToggle variant="sidebar" />
        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-ink-muted hover:bg-surface-raised hover:text-ink"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  )

  if (variant === "sidebar") {
    return (
      <div ref={ref} className="relative">
        {open && menu}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left hover:bg-surface-raised"
        >
          <Avatar user={user} className="h-7 w-7 shrink-0" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-ink">{user.name ?? "Account"}</span>
            {user.email && <span className="block truncate text-xs text-ink-muted">{user.email}</span>}
          </span>
        </button>
      </div>
    )
  }

  return (
    <div ref={ref} className="relative flex flex-1">
      {open && menu}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium text-ink-faint"
      >
        <Avatar user={user} className="h-6 w-6" />
        Account
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Wire it through `nav.tsx`**

- `Nav` accepts a prop: `export function Nav({ user }: { user: NavUser })` with `import { UserMenu, type NavUser } from "@/components/user-menu"`.
- Desktop sidebar footer `<div className="mt-auto flex flex-col gap-1">…</div>` becomes:

```tsx
<div className="mt-auto border-t border-edge pt-2">
  <UserMenu user={user} variant="sidebar" />
</div>
```

(remove the old `ThemeToggle` + sign-out form there).
- Mobile tab bar: replace `<ThemeToggle variant="tab" />` and the sign-out `<form>` with `<UserMenu user={user} variant="tab" />`.
- Remove the now-unused `signOutAction`/`ThemeToggle`/`signOutIcon` imports & const from `nav.tsx`.

- [ ] **Step 3: Pass the user from `app/(library)/layout.tsx`**

```tsx
<Nav
  user={{
    name: session.user?.name ?? null,
    email: session.user?.email ?? null,
    image: session.user?.image ?? null,
  }}
/>
```

- [ ] **Step 4: Update `e2e/dark-mode.spec.ts`** — the theme toggle now lives inside the menu:

```ts
await page.goto("/books")
const html = page.locator("html")
await page.locator(".nav-desktop").getByRole("button", { name: /E2E User|Account/ }).click()
const toggle = page.getByRole("button", { name: /Switch to .* theme/ })

await toggle.click()
await toggle.click()
await expect(html).toHaveClass(/dark/)

await page.reload()
await expect(page.locator("html")).toHaveClass(/dark/)
```

Note: clicking the toggle keeps the menu open (toggle is inside the popover, pointerdown inside `ref` doesn't close it) — so two clicks in a row work without reopening.

- [ ] **Step 5: Verify**

Verification loop (the existing `theme-toggle.test.tsx` must still pass — ThemeToggle itself is unchanged). Manual: open/close menu via click, outside click, Escape; check mobile variant; sign out works.

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/user-menu.tsx apps/web/components/nav.tsx "apps/web/app/(library)/layout.tsx" apps/web/e2e/dark-mode.spec.ts
git commit -m "feat: avatar user menu with theme toggle and sign out"
```

---

### Task 12: Books cover grid view

**Files:**
- Modify: `apps/web/components/books/books-list.tsx`

- [ ] **Step 1: Add the view toggle and grid rendering**

Changes to `BooksList` (which is already `"use client"`):

```tsx
import { useEffect, useState } from "react"
```

Add state + persistence (hydration-safe — start with "list", read localStorage after mount):

```tsx
const [view, setView] = useState<"list" | "grid">("list")

useEffect(() => {
  if (localStorage.getItem("books-view") === "grid") setView("grid")
}, [])

function changeView(next: "list" | "grid") {
  setView(next)
  localStorage.setItem("books-view", next)
}
```

Toolbar (replaces the current search-only `<div className="mb-4">`):

```tsx
<div className="mb-4 flex items-center justify-between gap-3">
  <input
    type="search"
    placeholder="Search books…"
    value={query}
    onChange={(e) => setQuery(e.target.value)}
    className={`w-full max-w-sm ${inputClass}`}
  />
  <div className="flex shrink-0 rounded-lg border border-edge bg-surface p-0.5" role="group" aria-label="View">
    {(["list", "grid"] as const).map((v) => (
      <button
        key={v}
        type="button"
        onClick={() => changeView(v)}
        aria-pressed={view === v}
        className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
          view === v ? "bg-accent-soft text-accent" : "text-ink-muted hover:text-ink"
        }`}
      >
        {v}
      </button>
    ))}
  </div>
</div>
```

Grid rendering (used when `view === "grid"` and `filtered.length > 0`; the existing `<ul>` list renders when `view === "list"`; empty states are shared):

```tsx
<ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
  {filtered.map((book) => (
    <li key={book.id}>
      <Link href={`/books/${book.id}`} className="group block">
        <div className="relative aspect-2/3 overflow-hidden rounded-lg border border-edge bg-surface-raised shadow-sm transition-transform group-hover:-translate-y-0.5">
          {book.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={book.coverUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-center">
              <span className="font-display text-sm font-semibold text-ink line-clamp-4">{book.title}</span>
            </div>
          )}
          <span
            aria-label={book.isCheckedOut ? "Checked out" : "Available"}
            className={`absolute right-2 top-2 h-2.5 w-2.5 rounded-full ring-2 ring-surface ${
              book.isCheckedOut ? "bg-amber-500" : "bg-emerald-500"
            }`}
          />
        </div>
        <p className="mt-2 truncate text-sm font-medium text-ink">{book.title}</p>
        {book.authors && <p className="truncate text-xs text-ink-muted">{book.authors}</p>}
      </Link>
    </li>
  ))}
</ul>
```

- [ ] **Step 2: Verify**

Verification loop. Manual: toggle list/grid, reload (grid persists), search filters the grid, status dots correct, no-cover books show the title placeholder.

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/books/books-list.tsx
git commit -m "feat: cover grid view with persisted list/grid toggle"
```

---

### Task 13: Landing page

**Files:**
- Modify: `apps/web/app/page.tsx`

- [ ] **Step 1: Rewrite `app/page.tsx`**

```tsx
import { auth, signIn } from "@/auth"
import { redirect } from "next/navigation"
import { HearthGlyph, Wordmark } from "@/components/brand"
import { btnPrimary, btnSecondary } from "@/components/ui/classes"

const features = [
  {
    title: "Track your shelf",
    description: "Catalog every book you own — search by title, scan a barcode, or look up an ISBN.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    title: "Lend with confidence",
    description: "Check books out to friends with due dates, and always know who has what.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
  },
  {
    title: "Import in bulk",
    description: "Bring your whole library over at once with CSV import for books and contacts.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
    ),
  },
]

export default async function HomePage() {
  const session = await auth()
  if (session) redirect("/dashboard")

  return (
    <main className="flex flex-1 flex-col bg-canvas">
      <header className="px-6 py-5 sm:px-10">
        <Wordmark />
      </header>

      <section className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <HearthGlyph className="mb-6 h-14 w-14 text-accent" />
        <h1 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Your home library, kept warm.
        </h1>
        <p className="mt-4 max-w-md text-ink-muted">
          Hearthshelf keeps track of every book you own and every book you&apos;ve lent —
          so your favorites always find their way home.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <form
            action={async () => {
              "use server"
              await signIn("github", { redirectTo: "/dashboard" })
            }}
          >
            <button type="submit" className={`${btnPrimary} w-full gap-2 px-6 py-2.5 sm:w-auto`}>
              <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              Sign in with GitHub
            </button>
          </form>
          <form
            action={async () => {
              "use server"
              await signIn("google", { redirectTo: "/dashboard" })
            }}
          >
            <button type="submit" className={`${btnSecondary} w-full gap-2 px-6 py-2.5 sm:w-auto`}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.57 5.57 0 01-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0012 24z" />
                <path fill="#FBBC05" d="M5.27 14.29a7.2 7.2 0 010-4.58V6.62H1.29a12.04 12.04 0 000 10.76l3.98-3.09z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
              </svg>
              Sign in with Google
            </button>
          </form>
        </div>
      </section>

      <section className="px-6 pb-16 sm:px-10">
        <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-xl border border-edge bg-surface p-5 shadow-sm">
              <span className="text-accent">{feature.icon}</span>
              <h2 className="mt-3 font-display text-base font-semibold text-ink">{feature.title}</h2>
              <p className="mt-1 text-sm text-ink-muted">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-edge px-6 py-6 sm:px-10">
        <Wordmark className="opacity-70" />
      </footer>
    </main>
  )
}
```

- [ ] **Step 2: Verify**

Verification loop. Manual: signed-out `/` shows the hero in light + dark; both sign-in buttons render; signed-in `/` still redirects to /dashboard.

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/page.tsx
git commit -m "feat: Hearthshelf landing page with hero and feature highlights"
```

---

### Task 14: Final verification

**Files:** none new — fixes only if checks fail.

- [ ] **Step 1: Full static + unit pass**

```bash
cd apps/web && npx tsc --noEmit && npm run lint && npm run test
```

- [ ] **Step 2: Confirm no zinc remains in app code**

```bash
grep -rn "zinc" apps/web/app apps/web/components --include="*.tsx" --include="*.ts" --include="*.css"
```
Expected: no output.

- [ ] **Step 3: Integration + e2e**

```bash
npm run test:db:up && npm run db:push:test && npm run test:integration && npm run test:e2e && npm run test:db:down
```
Expected: all pass (auth, books, dark-mode specs updated in Tasks 10–11).

- [ ] **Step 4: Visual sweep**

With `npm run dev`, screenshot in light and dark: `/` (signed out), `/dashboard` (empty + with data), `/books` (list + grid + empty + search-no-match), a book detail, `/books/new`, `/contacts`, `/checkouts` (active + overdue + empty), an import page. Confirm toasts after add/return, user menu open/close on desktop + mobile width.

- [ ] **Step 5: Commit any fixes**

```bash
git add -A && git commit -m "fix: polish pass cleanups from final verification"
```
(Skip if nothing changed.)
