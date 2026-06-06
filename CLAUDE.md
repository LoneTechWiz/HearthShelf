# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.
**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding
**Don't assume. Don't hide confusion. Surface tradeoffs.**
Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First
**Minimum code that solves the problem. Nothing speculative.**
- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.
  Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes
**Touch only what you must. Clean up only your own mess.**
When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution
**Define success criteria. Loop until verified.**
Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```
Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## 5. Clean Code, Clear Comments
**Code should read like a well-written explanation. Comments should add value, not noise.**
Write code that communicates intent:
- Use descriptive names for variables, functions, and types — avoid abbreviations unless universally understood (`i`, `err`, `ctx` are fine; `uidxmap` is not).
- Keep functions short and single-purpose. If you can't describe what a function does in one sentence, split it.
- Prefer flat over nested. Early returns, guard clauses, and extracted helpers beat deeply indented logic.

Write comments that earn their place:
- Comment the *why*, not the *what*. `// Retry up to 3 times to handle transient failures` is useful. `// increment i` is not.
- Delete comments that restate the code. If the code is clear, the comment is clutter.
- Flag non-obvious behavior: workarounds, external constraints, known limitations, or surprising edge cases.
- Use TODO/FIXME with context: `// TODO: replace once API supports batch deletes`.

The test: If a comment were removed, would a reader understand less? If no — delete it. If yes — keep it short and precise.

---
**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

@AGENTS.md

## Commands

All commands run from the repo root unless noted.

```bash
npm run dev          # start Next.js dev server (apps/web)
npm run build        # production build
npm run db:push      # push schema to DB without a migration file (fast iteration)
npm run db:generate  # generate a migration file from schema changes
npm run db:migrate   # run pending migration files
npm run db:studio    # open Drizzle Studio GUI at localhost:4983
```

Run these from `apps/web/` directly when you need scoped output:

```bash
npx tsc --noEmit     # type-check
npm run lint         # ESLint
```

Install always requires `--legacy-peer-deps` because Expo (apps/mobile) has unresolved peer deps that are normal for its ecosystem.

## Architecture

### Monorepo layout

npm workspaces. Three packages:

- `apps/web` — Next.js 16 web app, the primary product
- `apps/mobile` — Expo placeholder (not yet initialized)
- `packages/types` — shared TypeScript interfaces consumed by both apps

### apps/web internals

**Database** — Drizzle ORM with the `postgres` driver. All table definitions live in `apps/web/lib/db/schema.ts`. The Drizzle client is a singleton exported from `apps/web/lib/db/index.ts`. Schema has two groups:

- Auth.js-required tables: `user`, `account`, `session`, `verificationToken`
- App tables: `book`, `contact`, `checkout`

A `checkout.contactId = null` means the library owner has the book themselves. When set, it points to the contact currently holding the book.

**Auth** — Auth.js v5 (`next-auth@beta`; v5 is still in beta as of this writing). Config is in `apps/web/auth.ts`, which exports `{ handlers, auth, signIn, signOut }`. The GitHub provider is wired by default; swap or add providers there. The API route at `app/api/auth/[...nextauth]/route.ts` simply re-exports `handlers`.

**Routing** — App Router. The `(library)` route group covers all authenticated pages (`/books`, `/contacts`, `/checkouts`). Its `layout.tsx` calls `auth()` server-side and redirects unauthenticated visitors to `/`. The root `app/page.tsx` is the public landing/sign-in page.

**Path alias** — `@/*` resolves to `apps/web/*`. Use it for all internal imports.

### Environment

Copy `apps/web/.env.local.example` to `apps/web/.env.local` and fill in:

- `DATABASE_URL` — PostgreSQL connection string
- `AUTH_SECRET` — random secret (`openssl rand -base64 32`)
- `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` — GitHub OAuth app credentials