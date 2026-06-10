# Hearthshelf Polish — Design

**Date:** 2026-06-10
**Status:** Approved by user (sections reviewed individually)

## Goal

Turn the My-Shelf web app from a generic zinc/Tailwind UI into a branded, production-feeling
platform named **Hearthshelf**, with a warm & literary visual identity, refined components,
and the UX affordances real platforms have (dashboard, toasts, user menu, cover grid view,
polished landing page).

## Approach

Approach A (chosen over adopting shadcn/ui or a cosmetic-only reskin): semantic design
tokens in Tailwind v4 `@theme` + hand-built components matching the codebase's existing
style. Only new dependency: `sonner` for toasts.

## 1. Visual identity

### Name & wordmark

- Product name: **Hearthshelf** (hearthshelf.com verified unregistered via RDAP on 2026-06-10).
- Replaces "Personal Library" / "My-Shelf" in: page metadata, landing page, sidebar header.
- Wordmark is text-based: "Hearthshelf" in the display serif plus a small flame-on-shelf
  glyph (inline SVG, reused as favicon). No image assets.

### Typography

- Add **Fraunces** (Google Fonts, variable) via `next/font` as `--font-display`.
  Used for wordmark, `h1`/`h2` page titles, landing hero.
- Body stays **Geist**. Fix `globals.css` so `body` actually uses the Geist variable
  (currently falls back to Arial).

### Palette — semantic tokens in `globals.css` `@theme`

| Token | Light | Dark | Used for |
|---|---|---|---|
| `canvas` | `#faf6f0` warm cream | `#161210` brown-black | page background |
| `surface` | `#fffdfa` | `#211b16` warm charcoal | cards, sidebar, inputs |
| `ink` / `ink-muted` / `ink-faint` | espresso `#2b211b` → warm grays | warm off-white → warm grays | text hierarchy |
| `edge` | `#e8e0d4` | `#372e26` | borders, dividers |
| `accent` / `accent-hover` | russet `#b4530a` | amber `#e08a3c` | primary buttons, links, active nav, focus rings |

- Status colors: emerald = available, amber = checked out, red = overdue.
- Exact shades for `ink-muted`/`ink-faint` and dark-mode grays are implementation
  latitude, as long as they stay warm-toned and meet contrast on their backgrounds.
- Every existing `zinc-*` classname maps to a token during the sweep.

## 2. Component & page refinement sweep

Markup/classname changes only — no behavior changes; existing tests unaffected.

- **Buttons:** three recipes (primary = accent bg; secondary = surface + edge border;
  ghost/destructive). All get `focus-visible` accent rings and pressed states.
- **Cards & lists:** subtle warm-tinted `shadow-sm`; larger cover thumbnails with edge
  border; cover fallback shows a book glyph instead of an empty gray rectangle.
- **Empty states:** every list (books, contacts, checkouts, search-no-results, history)
  gets centered icon + heading + helper sentence + primary action.
- **Forms:** unified input/select/textarea style (surface bg, edge border, accent focus
  ring), unified label/error/helper text styles.
- **Status badges:** one shared recipe (consistent padding, dot indicator) for
  Available / Checked out / Overdue across books list, book detail, checkouts.
- **Page headers:** shared pattern — Fraunces title, optional subtitle, right-aligned
  actions, sensible mobile collapse.
- **Nav:** wordmark at sidebar top; accent-tinted active state with left indicator bar;
  accent active tint on mobile tab bar.

## 3. New UX features

### Dashboard

- New route `app/(library)/dashboard/page.tsx`; becomes the post-sign-in landing.
  Root page redirect and sign-in `redirectTo` change `/books` → `/dashboard`.
  Nav gains "Home" above Books.
- Server-rendered content (existing query helpers + one new aggregate query):
  - Stat cards (4-up): Total books · Checked out now · Overdue · Contacts.
  - Recent activity: last 5 checkout/return events (book, contact, date).
  - Currently out: compact active-checkout list with due dates, overdue flagged red,
    linking to books.
  - Quick actions: Add book / Check out / Add contact. Empty library shows a welcome
    state pointing to Add book / Import CSV.

### Toasts

- Add `sonner`, themed to palette; `<Toaster />` mounted in the library layout.
- Server actions redirect with a short-lived flash cookie (e.g. `flash=Book added`);
  a small client component in the layout reads the cookie, fires the toast, clears it.
- Covers: add/edit/delete book, add/edit/delete contact, check out, return.
- Form validation errors stay inline as today.

### User menu

- Sidebar footer: avatar (`session.user.image`), name, email. Click opens a hand-built
  popover (~40 lines; outside-click + Escape handling) containing theme toggle and
  Sign out — replacing the current bare sidebar buttons.
- Mobile: the sign-out tab becomes an avatar tab opening the same menu as a bottom sheet.

### Cover grid view

- Books page gets a list/grid toggle next to search. Grid: responsive cover wall
  (2–6 columns), title/author beneath cover, status dot overlay, links to book.
- Preference persists in `localStorage`; default remains list. Search filters both views.

## 4. Landing page

- Hero on warm canvas: glyph + wordmark in Fraunces, tagline "Your home library, kept
  warm.", one supporting sentence, GitHub/Google sign-in buttons styled
  primary/secondary with provider icons.
- Below: 3-feature row (Track your shelf · Lend with confidence · Import in bulk) with
  small icons. Footer with wordmark. No screenshots or fake testimonials.
- Metadata (`title`, `description`, favicon) updated to Hearthshelf.

## Verification

- `npx tsc --noEmit` and `npm run lint` clean after each chunk.
- `npm run test` keeps passing; add a unit test for the dashboard aggregate query and a
  component test for the flash-toast reader.
- Update e2e specs that assert on copy or the post-sign-in redirect (`/books` → `/dashboard`,
  "Personal Library" → "Hearthshelf").
- Visual check of every page in light + dark via dev server Playwright screenshots.

## Out of scope

- apps/mobile (Expo placeholder untouched).
- New logo image assets, marketing screenshots, testimonials.
- Changing auth providers or any database schema beyond read-only aggregate queries.
