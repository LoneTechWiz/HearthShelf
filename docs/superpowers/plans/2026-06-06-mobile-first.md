# Mobile-First Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the app mobile-first by replacing the sidebar with a responsive nav that renders a fixed bottom tab bar on mobile and the existing sidebar on desktop.

**Architecture:** Two changes only — `components/nav.tsx` gets two visually distinct modes driven by Tailwind breakpoints, and `app/(library)/layout.tsx` adjusts padding to accommodate the fixed bottom bar on mobile. No JS logic, no new dependencies.

**Tech Stack:** React, Tailwind CSS, Next.js App Router.

---

## File Map

| Action | Path |
|--------|------|
| Modify | `apps/web/components/nav.tsx` |
| Modify | `apps/web/app/(library)/layout.tsx` |

---

## Task 1: Responsive Nav Component

**Files:**
- Modify: `apps/web/components/nav.tsx`

- [ ] **Step 1: Replace nav.tsx with the responsive version**

Replace the entire contents of `apps/web/components/nav.tsx` with:

```tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOutAction } from "@/lib/actions/auth"

const links = [
  {
    href: "/books",
    label: "Books",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    href: "/contacts",
    label: "Contacts",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    href: "/checkouts",
    label: "Checkouts",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
  },
]

const signOutIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
  </svg>
)

export function Nav() {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop sidebar */}
      <nav
        aria-label="Library"
        className="hidden md:flex w-48 flex-col gap-1 border-r border-zinc-200 bg-white px-3 py-6"
      >
        <p
          aria-hidden="true"
          className="mb-4 px-2 text-xs font-semibold uppercase tracking-widest text-zinc-400"
        >
          Library
        </p>
        {links.map(({ href, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              {label}
            </Link>
          )
        })}
        <form action={signOutAction} className="mt-auto">
          <button
            type="submit"
            className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
          >
            Sign out
          </button>
        </form>
      </nav>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Library"
        className="fixed bottom-0 left-0 right-0 z-50 flex h-14 border-t border-zinc-200 bg-white md:hidden"
      >
        {links.map(({ href, label, icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors ${
                isActive ? "text-zinc-900" : "text-zinc-400"
              }`}
            >
              {icon}
              {label}
            </Link>
          )
        })}
        <form action={signOutAction} className="flex flex-1">
          <button
            type="submit"
            className="flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-900"
          >
            {signOutIcon}
            Sign out
          </button>
        </form>
      </nav>
    </>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/nav.tsx
git commit -m "feat: add responsive bottom tab bar for mobile nav"
```

---

## Task 2: Library Layout Padding

**Files:**
- Modify: `apps/web/app/(library)/layout.tsx`

- [ ] **Step 1: Update the content wrapper classes**

In `apps/web/app/(library)/layout.tsx`, change the content wrapper div from:

```tsx
<div className="flex-1 overflow-y-auto bg-zinc-50 p-8">{children}</div>
```

To:

```tsx
<div className="flex-1 overflow-y-auto bg-zinc-50 p-4 pb-20 md:p-8">{children}</div>
```

`p-4` sets 16px padding on mobile, `pb-20` adds 80px bottom padding to clear the 56px fixed tab bar, and `md:p-8` restores 32px padding on desktop (overriding both mobile values).

- [ ] **Step 2: Type-check and run tests**

```bash
cd apps/web && npx tsc --noEmit && npx vitest run
```

Expected: no type errors, all 35 tests pass

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/\(library\)/layout.tsx
git commit -m "feat: adjust layout padding for mobile-first design"
```
