# Bulk CSV Import for Books and Contacts — Design

**Date:** 2026-06-09
**Status:** Approved (pending spec review)

## Goal

Let a library owner add many books or contacts at once by uploading a CSV file,
instead of filling in the single-entry form one record at a time. Imports are
idempotent: re-uploading a file with records that already exist updates them in
place rather than creating duplicates. After a book import, the owner can review
and enrich the imported rows (filling missing authors/cover/description from an
ISBN lookup) on a bulk-edit page.

## Decisions

These were settled during brainstorming and drive the design:

- **Invalid rows:** skip and report. Import every valid row; show a summary of
  what was created/updated and which rows were skipped (with line numbers and
  reasons). The whole file is rejected only when it is unusable (empty, or
  missing a required column header).
- **Book enrichment:** import the CSV as-is (no automatic network lookups during
  import). Enrichment happens later on an opt-in bulk-edit page.
- **UI entry point:** dedicated import pages (`/books/import`, `/contacts/import`),
  linked from the respective list pages.
- **Bulk-edit scope (books only):** reachable both for the whole library (from
  the Books list) and scoped to a just-imported batch (via `?ids=` from the
  import summary).
- **Duplicate match key — books:** ISBN when the row has one; otherwise
  case-insensitive title + author(s).
- **Duplicate match key — contacts:** email when present; otherwise
  case-insensitive name.
- **Update semantics on a match:** overwrite the existing record's fields with
  the CSV row's *non-empty* values; leave a field untouched when the CSV cell is
  blank, so an import can never wipe existing data with empty cells.
- **Match scope:** per-user, and applied within the file as well — if the same
  key appears twice in one CSV, the later row updates the earlier one rather than
  producing two records.

## Out of scope

- Contact enrichment (contacts have no ISBN/lookup source).
- A preview-before-commit confirmation gate (skip-and-report covers the need).
- Importing checkouts.
- CSV *export*.

## Architecture

The feature reuses the existing layering exactly:

- **Pages** under `app/(library)/...` render thin server components.
- **Client components** under `components/...` handle interactivity.
- **Server actions** in `lib/actions/...` do auth, parsing, validation, and
  orchestration, returning a serializable result.
- **Query/record functions** in `lib/queries/...` own all database access.

New shared utility: a small, dependency-free CSV parser under `lib/csv/`.

### 1. CSV parsing — `lib/csv/parse.ts`

```ts
// Splits CSV text into rows of cells. Handles "quoted, fields",
// "" escaped quotes, and CRLF/LF line endings. Skips fully blank lines.
export function parseCsv(text: string): string[][]

// Maps parsed rows onto expected columns using row 0 as the header.
// Column matching is case-insensitive and trims whitespace. Unknown
// columns are ignored; cells absent or empty become null.
export function toRecords(
  rows: string[][],
  columns: readonly string[]
): { records: Array<Record<string, string | null>>; missingColumns: string[] }
```

`toRecords` returns `missingColumns` so an action can reject the whole file when a
required column header is absent. Each produced record carries its source line
number (1-based, counting the header as line 1) so skipped-row reasons can cite
it; this is tracked alongside the record (e.g. `{ line, values }`).

Both functions are pure and unit-tested.

### 2. Shared import UI — `components/csv-import.tsx`

A single client component used by both import pages.

Props:
- `action` — the server action (`importBooks` or `importContacts`).
- `columns` — column spec used to render an "expected columns" hint and to
  generate a downloadable template (`.csv` with the header row + one example row).
- `entity` — label used in copy ("books" / "contacts").
- `nextStep?` — optional `{ hrefBase, label }`; when present, the success
  summary renders a button linking to `${hrefBase}?ids=${importedIds.join(",")}`.

Behavior:
- File `<input type="file" accept=".csv">`.
- On submit: read `file.text()` and pass the raw text to the action via
  `useActionState`. (Parsing happens server-side; the client only ships text.)
- Renders the result:
  - Whole-file error (empty file / missing required column) as an error banner.
  - Otherwise a summary: `Created N`, `Updated M`, `Skipped K`, followed by a
    list of skipped rows (`line X: reason`).
  - For books, the "Review & enrich imported books" button (from `nextStep`).

### 3. Books import

- **Page:** `app/(library)/books/import/page.tsx` — back link + `<CsvImport>`
  configured for books. Columns: `title` (required), `authors`, `isbn`,
  `description`, `coverUrl`.
- **List link:** add an "Import CSV" link to the Books list header
  (`app/(library)/books/page.tsx`), beside "Add Book".
- **Action:** `importBooks(prevState, formData)` in `lib/actions/books.ts`:
  1. `auth()`; reject if unauthenticated.
  2. `parseCsv` + `toRecords(..., ["title","authors","isbn","description","coverUrl"])`.
  3. If the file is empty or `title` is in `missingColumns`, return a whole-file
     error.
  4. For each record, in order:
     - Skip with a reason if `title` is empty.
     - Upsert (see matching below); track whether it created or updated, and
       collect the resulting book id.
  5. `revalidatePath("/books")`.
  6. Return `{ created, updated, skipped: [{ line, reason }], importedIds }`.

### 4. Contacts import

- **Page:** `app/(library)/contacts/import/page.tsx` — back link + `<CsvImport>`
  for contacts. Columns: `name` (required), `email`, `phone`. No `nextStep`.
- **List link:** "Import CSV" link on the Contacts list header.
- **Action:** `importContacts` in `lib/actions/contacts.ts`, same shape as
  `importBooks` minus `importedIds`/enrichment. Skips rows with empty `name`.
  Returns `{ created, updated, skipped }`.

### 5. Upsert / matching — queries layer

Matching and writes stay in `lib/queries`. The actions call them; intra-file
dedupe falls out naturally because each row is processed sequentially against the
current database state (a row inserted earlier in the same batch is found by a
later matching row and updated).

**Books — `lib/queries/books.ts`:**

```ts
// Returns the id of an existing book for this user matching the row, or null.
// Match: by ISBN when isbn is non-null; otherwise by case-insensitive
// title + authors (authors compared as-is, null treated as empty).
export async function findBookMatch(
  userId: string,
  row: { title: string; authors: string | null; isbn: string | null }
): Promise<string | null>

// Inserts a new book, returns its id.
export async function createBookRecordReturningId(
  userId: string,
  data: BookData
): Promise<string>
```

The existing `updateBookRecord` is reused for the update path. The action builds
the update payload by taking, per field, the CSV value when non-empty else the
existing record's current value (so blanks don't overwrite) — this requires the
update path to read the current row first, so the helper returns the full
existing record:

```ts
// Full existing row for merge-on-update (null cells preserve existing data).
export async function getBookRowById(id: string, userId: string): Promise<BookRow | null>
```

> Implementation note: `getBookById` already exists but returns availability
> info via a join. `getBookRowById` is a plain single-row read used for the
> merge; if the existing helper is trivially reusable, prefer it over adding a
> near-duplicate.

**Contacts — `lib/queries/contacts.ts`:** mirror the above with
`findContactMatch` (email when present, else case-insensitive name),
`createContactRecordReturningId`, and a plain row read for the merge (the
existing `getContactById` already returns the full row and can be reused).

Case-insensitive comparison uses SQL `lower(...)` on both sides.

### 6. Books bulk-edit

- **Page:** `app/(library)/books/bulk-edit/page.tsx` — server component. Reads
  the user's books; if `?ids=` is present, filters to that set and titles the
  page "Review imported books", otherwise "Bulk edit" over the whole library.
- **List link:** "Bulk edit" link on the Books list header.
- **Component:** `components/books/book-bulk-edit.tsx` (client). Editable table,
  one row per book with inline inputs for **Title**, **Author(s)**, **ISBN**, and
  a per-row **Lookup** button. Lookup calls the existing `lookupByIsbn`
  (`lib/open-library`) and fills the row's *empty* `authors`, plus the hidden
  `coverUrl`/`description`, leaving non-empty fields alone. A single "Save all"
  submits changed rows to `bulkUpdateBooks`.
- **Action:** `bulkUpdateBooks` in `lib/actions/books.ts` — auth, then apply each
  changed row via `updateBookRecord` (scoped to the user). Returns a small
  `{ updated, error? }` result. New query `getBooksByIds(userId, ids)` supports
  the scoped page load.

## Data flow (books import → enrich)

1. Owner uploads `books.csv` on `/books/import`.
2. `CsvImport` reads the text, calls `importBooks`.
3. `importBooks` parses, upserts each valid row, returns
   `{ created, updated, skipped, importedIds }`.
4. Summary renders counts + skipped rows; owner clicks "Review & enrich imported
   books" → `/books/bulk-edit?ids=…`.
5. On the bulk-edit page the owner clicks **Lookup** on rows missing data, then
   "Save all" → `bulkUpdateBooks`.

Contacts stop at step 3's summary (no enrichment).

## Error handling

- **Whole-file rejection:** empty file, or a required column header missing →
  error banner, nothing written.
- **Per-row skip:** required field empty → row skipped with `line N: <reason>`.
  Malformed quoting that the parser cannot resolve surfaces as a skipped row for
  that line rather than failing the whole import.
- **Auth:** every action returns `{ error: "Unauthorized" }` when there is no
  session user, matching existing actions.
- **Lookup failure** on bulk-edit is per-row and non-fatal (mirrors the existing
  single-book form's lookup error handling).

## Testing

Following the vitest/testing stack on this branch:

- **`parseCsv` (unit):** quoted fields, embedded commas, `""` escaped quotes,
  CRLF vs LF, trailing newline, blank lines skipped.
- **`toRecords` (unit):** case-insensitive header match, unknown columns ignored,
  missing optional cells → null, `missingColumns` reports an absent required
  header, line numbers tracked.
- **Matching/upsert (integration, against the test DB):** ISBN match updates;
  title+author fallback match updates; no match inserts; blank CSV cell does not
  overwrite existing data; intra-file duplicate updates the first row; contacts
  email match and name fallback.

## Files

**New**
- `lib/csv/parse.ts`
- `components/csv-import.tsx`
- `app/(library)/books/import/page.tsx`
- `app/(library)/contacts/import/page.tsx`
- `app/(library)/books/bulk-edit/page.tsx`
- `components/books/book-bulk-edit.tsx`
- tests for the parser and matching/upsert paths

**Modified**
- `lib/actions/books.ts` — add `importBooks`, `bulkUpdateBooks`
- `lib/actions/contacts.ts` — add `importContacts`
- `lib/queries/books.ts` — add `findBookMatch`, `createBookRecordReturningId`,
  `getBooksByIds`, plain-row read helper
- `lib/queries/contacts.ts` — add `findContactMatch`,
  `createContactRecordReturningId`
- `app/(library)/books/page.tsx` — "Import CSV" + "Bulk edit" links
- `app/(library)/contacts/page.tsx` — "Import CSV" link
