# HearthShelf

A personal media-shelf manager. Catalog the books, movies, and games you own, track who you lend them to, and keep grouped views of your shelf.

## Features

- **Unified shelf** — browse books, movies, and games from one shelf page with type toggles, list/grid views, search, availability badges, and checkout shortcuts.
- **Books** — add books manually, by title search, or by ISBN/barcode lookup; store title, authors, ISBN, series metadata, description, genre, and cover image.
- **Movies** — add movies manually or from OMDb search; store title, series, director, year, poster, format, genre, runtime, and description. Series is user-editable and inferred from clear title patterns when possible.
- **Games** — add games manually or from BoardGameGeek search; store title, player counts, age rating, genre/category, description, and optional cover URL. Search combines exact and broad BGG matches so original titles rank ahead of variants.
- **Collections** — browse grouped shelf views: books by author or series, movies by series or genre, and games by category or player count. Duplicate copies are counted separately but do not inflate unique collection completion counts.
- **Lending tracker** — check any lendable item out to contacts or yourself with a sensible default due date, optional notes, return history, and overdue highlighting.
- **Contacts and requests** — maintain manual contacts, search HearthShelf users by name, and connect through contact requests that must be accepted. Connected-user emails stay hidden and request-created contacts are not editable.
- **CSV import and bulk edit** — bulk-import books, movies, games, and contacts, then review imported shelf items in focused bulk-edit screens.
- **Dashboard** — see shelf totals, current checkouts, overdue counts, contacts, a shelf overview for books/movies/games, currently-out items, and recent activity.
- **Mobile navigation** — app-like mobile navigation keeps Dashboard, Shelf, Collections, and Checkouts primary while type-specific shelf pages redirect into the unified shelf.
- **External metadata attribution** — provider credits are shown for Open Library, OMDb API, and BoardGameGeek where metadata is used.
- **Auth** — sign in with Google or GitHub; accounts are linked by email across providers.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database | PostgreSQL via Drizzle ORM; Supabase is used for production database hosting |
| Auth | Auth.js v5 (next-auth@beta) |
| Styling | Tailwind CSS |
| Monorepo | npm workspaces |
| Metadata APIs | Open Library, OMDb API, BoardGameGeek XML API |

## Project structure

```
apps/
  web/        # Next.js app (primary product)
  mobile/     # Expo placeholder (not yet initialized)
packages/
  types/      # Shared TypeScript interfaces
```

Key paths inside `apps/web/`:

```
app/
  page.tsx                     # Public landing / sign-in page
  api/                         # Auth and metadata API routes
  (library)/
    dashboard/page.tsx         # Stats + activity feed
    shelf/page.tsx             # Unified books/movies/games shelf
    collections/page.tsx       # Grouped collection views
    books/                     # Detail, add, edit, import, bulk-edit
    movies/                    # Detail, add, edit, import, bulk-edit
    games/                     # Detail, add, edit, import, bulk-edit
    contacts/                  # Contacts, requests, add, edit, import
    checkouts/                 # Active checkouts, history, new checkout
components/
  books/                       # Book forms, lists, barcode scanner
  movies/                      # Movie forms and lists
  games/                       # Game forms and lists
  collections/                 # Grouped shelf collection UI
  shelf/                       # Unified shelf type switcher
lib/
  db/
    schema.ts                  # Drizzle table definitions
    index.ts                   # Singleton DB client
  actions/                     # Server actions (mutations)
  queries/                     # Read-only DB queries
  shelf-collections.ts         # Collection grouping logic
  movie-series.ts              # Movie title-to-series inference
auth.ts                        # Auth.js config (Google + GitHub providers)
```

## Getting started

### Prerequisites

- Node.js 20+
- PostgreSQL database

### Setup

```bash
# Install dependencies (--legacy-peer-deps required for Expo peer dep quirks)
npm install --legacy-peer-deps

# Copy and fill in environment variables
cp apps/web/.env.local.example apps/web/.env.local
```

Required variables in `apps/web/.env.local`:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Random secret - `openssl rand -base64 32` |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | GitHub OAuth app credentials |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth app credentials |
| `OMDB_API_KEY` | OMDb API key for movie search and metadata lookup |
| `BGG_API_KEY` | BoardGameGeek API key used by the BGG proxy route |

```bash
# Push schema to the database
npm run db:push

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

All commands run from the repo root unless noted.

```bash
npm run dev          # Start Next.js dev server
npm run build        # Production build
npm run db:push      # Push schema to DB (fast iteration, no migration file)
npm run db:generate  # Generate a migration file from schema changes
npm run db:migrate   # Run pending migrations
npm run db:studio    # Open Drizzle Studio at localhost:4983
```

Run from `apps/web/` for scoped output:

```bash
npx tsc --noEmit    # Type-check
npm run lint        # ESLint
npm test            # Vitest unit/component tests
npm run test:e2e    # Playwright e2e tests
```
