# ISBN Lookup & Title Autocomplete — Design Spec

**Date:** 2026-06-06

## Summary

Add real-time book lookup to the Add Book form using the Open Library API (free, no key required, CORS-enabled). Two interactions: title autocomplete via a dropdown, and ISBN autofill on blur or button click.

---

## Architecture

All logic lives in `apps/web/components/books/book-form.tsx` (already a client component). One new presentational component is extracted: `BookSearchDropdown`.

### Open Library Endpoints

- **Title search:** `https://openlibrary.org/search.json?title=<query>&limit=5`
  - Response fields used: `title`, `author_name[]`, `isbn[]`, `cover_i`
  - Cover URL: `https://covers.openlibrary.org/b/id/{cover_i}-M.jpg`
- **ISBN lookup:** `https://openlibrary.org/api/books?bibkeys=ISBN:<isbn>&format=json&jscmd=data`
  - Response fields used: `title`, `authors[].name`, `cover.medium`, `description` (string or `{value: string}`)

---

## Components

### `BookForm` (modified)

Converts all fields from uncontrolled (`defaultValue`) to controlled (`useState`) so results from the API can populate them.

**New state:**
- `titleQuery` — controlled value for title input
- `suggestions` — `BookSuggestion[]` from search API
- `isSearching` — boolean, title search in flight
- `isLookingUp` — boolean, ISBN lookup in flight
- `searchError` / `lookupError` — `string | null`

**Behavior:**
- Title input: debounce 300ms, minimum 2 characters before fetching
- Selecting a suggestion populates all fields and clears the dropdown
- ISBN input: lookup fires on blur and on "Lookup" button click
- ISBN lookup populates all fields silently (no overwrite confirmation)

### `BookSearchDropdown` (new)

Purely presentational. Renders the suggestions list.

**Props:**
- `suggestions: BookSuggestion[]`
- `isSearching: boolean`
- `onSelect: (suggestion: BookSuggestion) => void`

**UI:** Small cover thumbnail, book title, authors, and ISBN per row. "No books found" when results are empty and not loading. Closes on outside click or item selection.

### `BookSuggestion` type

```ts
type BookSuggestion = {
  title: string
  authors: string
  isbn: string
  coverUrl: string | null
  description: string | null
}
```

---

## Data Flow

```
Title typed (≥2 chars)
  → 300ms debounce
  → GET /search.json?title=...&limit=5
  → map response → BookSuggestion[]
  → render BookSearchDropdown

User selects suggestion
  → populate title, authors, isbn, coverUrl, description state
  → close dropdown

ISBN blur or "Lookup" button click
  → GET /api/books?bibkeys=ISBN:...&format=json&jscmd=data
  → map response → populate all fields
```

---

## Error Handling

- API failure → set `searchError` / `lookupError`, show inline message below the field
- No results → show "No books found" in dropdown
- Neither error blocks form submission

---

## Out of Scope

- Caching API responses
- Server-side proxy for API calls
- Overwrite confirmation when fields are already filled
