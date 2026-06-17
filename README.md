# Hearthshelf

A personal home-library manager. Catalog the books you own, track who you've lent them to, and always know when they're due back.

## Features

- **Book catalog** — add books manually or by ISBN; store title, authors, description, and cover image
- **Lending tracker** — check books out to contacts (or yourself) with optional due dates and notes; mark them returned
- **Overdue alerts** — dashboard and checkout list highlight books past their due date
- **Contacts** — maintain a list of the people you lend books to
- **CSV import** — bulk-import books or contacts from a spreadsheet; a post-import bulk-edit screen lets you enrich cover images, descriptions, and other fields before saving
- **Dashboard** — at-a-glance stats (total books, checked out, overdue, contacts), a live "currently out" list, and a recent-activity feed
- **Auth** — sign in with Google or GitHub; accounts linked by email across providers

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database | PostgreSQL via Drizzle ORM |
| Auth | Auth.js v5 (next-auth@beta) |
| Styling | Tailwind CSS |
| Monorepo | npm workspaces |

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
  (library)/
    dashboard/page.tsx         # Stats + activity feed
    books/                     # List, detail, add, edit, import, bulk-edit
    contacts/                  # List, detail, add, edit, import
    checkouts/                 # Active + history, new checkout
lib/
  db/
    schema.ts                  # Drizzle table definitions
    index.ts                   # Singleton DB client
  actions/                     # Server actions (mutations)
  queries/                     # Read-only DB queries
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
| `AUTH_SECRET` | Random secret — `openssl rand -base64 32` |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | GitHub OAuth app credentials |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth app credentials |

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
```
