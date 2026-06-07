# Dark Mode — Design

**Date:** 2026-06-07
**Status:** Approved

## Goal

Add a dark theme to the web app (`apps/web`) with a manual toggle that supports
Light, Dark, and System modes. The choice persists across visits and defaults to
the user's OS preference on first load, with no flash of the wrong theme on
reload.

## Decisions

- **Control:** Manual toggle with Light / Dark / System. Defaults to System.
- **Persistence:** Saved in `localStorage` (handled by `next-themes`).
- **Toggle placement:** Desktop sidebar (above "Sign out") and the mobile bottom
  tab bar (as a 5th item).
- **Scope:** All pages — public landing/sign-in page and all authenticated
  library pages, components, and forms.
- **Library:** `next-themes` for state, persistence, and flash-free hydration.

## Approach

Use `next-themes` rather than a hand-rolled context provider plus inline
`<head>` script. The hand-rolled path is more code and easy to get wrong
(flash-of-unstyled-content, hydration mismatches). `next-themes` is the standard
for the Next.js App Router and provides `system` mode out of the box.

## Changes

### 1. Dependency

Add `next-themes`:

```bash
npm install next-themes --legacy-peer-deps
```

(`--legacy-peer-deps` is required for this repo per AGENTS.md / CLAUDE.md.)

### 2. Tailwind dark variant (`app/globals.css`)

Tailwind v4 defaults the `dark:` variant to `prefers-color-scheme`. For a manual
override to work, switch it to class-based by adding:

```css
@custom-variant dark (&:where(.dark, .dark *));
```

Repoint the existing `--background` / `--foreground` CSS variables from the
`@media (prefers-color-scheme: dark)` block to the `.dark` class so they stay
consistent with the toggle. Remove the now-unused `@media` block.

### 3. Theme provider (`components/theme-provider.tsx`, new, client)

Thin wrapper around the `next-themes` `ThemeProvider`:

- `attribute="class"`
- `defaultTheme="system"`
- `enableSystem`

Wrap `{children}` in `app/layout.tsx`, and add `suppressHydrationWarning` to the
`<html>` element (required by next-themes because it sets the class before React
hydrates).

### 4. Theme toggle (`components/theme-toggle.tsx`, new, client)

A single button that cycles **System → Light → Dark → System**. Uses
monitor / sun / moon inline SVGs matching the existing nav icon style
(`h-6 w-6`, `stroke="currentColor"`, `strokeWidth={1.5}`).

- Renders only after mount (`useEffect` mounted guard) to avoid hydration
  mismatch, since the active theme is unknown during SSR.
- Shows the icon for the *current* selection and an accessible label
  (`aria-label`) describing the next state.

### 5. Nav integration (`components/nav.tsx`)

- **Desktop sidebar:** place the toggle just above the "Sign out" form (inside
  the `mt-auto` group so it sits at the bottom).
- **Mobile tab bar:** add the toggle as a 5th item alongside Books, Contacts,
  Checkouts, and Sign out. The toggle uses the same
  `flex flex-1 flex-col items-center` layout as the other tab items.

### 6. Dark variants across the UI

Add `dark:` classes everywhere zinc/white/black colors are used. Affected files:

- `app/layout.tsx`, `app/page.tsx`, `app/(library)/layout.tsx`
- `components/nav.tsx`
- everything under `components/books/`, `components/contacts/`,
  `components/checkouts/`
- page files under `app/(library)/` that carry color classes

Consistent mapping:

| Light | Dark |
|---|---|
| `bg-white` | `dark:bg-zinc-900` |
| `bg-zinc-50` (page background) | `dark:bg-zinc-950` |
| `bg-zinc-100` | `dark:bg-zinc-800` |
| `bg-zinc-700` (hover) | `dark:bg-zinc-700` (kept) |
| `text-zinc-900` | `dark:text-zinc-100` |
| `text-zinc-700` | `dark:text-zinc-300` |
| `text-zinc-600` | `dark:text-zinc-300` |
| `text-zinc-500` | `dark:text-zinc-400` |
| `text-zinc-400` | `dark:text-zinc-500` |
| `border-zinc-200` | `dark:border-zinc-800` |
| `border-zinc-300` | `dark:border-zinc-700` |
| `divide-zinc-100` | `dark:divide-zinc-800` |
| `ring-zinc-500` | `dark:ring-zinc-400` |
| `bg-zinc-900 text-white` (primary button) | `dark:bg-zinc-100 dark:text-zinc-900` (inverted) |

Primary buttons (currently `bg-zinc-900 text-white hover:bg-zinc-700`) invert in
dark mode to `dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300`.

## Out of scope

- No theme customization beyond light/dark/system.
- No per-component theme overrides.
- No changes to the mobile app (`apps/mobile`).

## Verification

- `npx tsc --noEmit` clean (run from `apps/web`).
- `npm run lint` clean (run from `apps/web`).
- Manual, against the running dev server:
  - Toggle cycles System → Light → Dark and updates the UI immediately.
  - Reload preserves the chosen theme with no flash of the wrong theme.
  - System mode follows OS preference.
  - Landing page, all library pages, forms, and both nav layouts render
    correctly in dark mode.

No automated test framework is configured in the repo, so verification is visual
against the dev server (Playwright screenshots where useful).
