# Movies & Games Collection Expansion

**Date:** 2026-06-18
**Status:** Approved

## Overview

Expand Hearthshelf beyond books to also manage personal movie and board/card game collections. All three collection types are lendable — items can be checked out to contacts with due dates, tracked, and marked returned. The checkout system is rebuilt around a polymorphic `lendableItem` bridge table that decouples checkouts from any specific collection type.

---

## Data Model

### New tables

**`movie`**
| Column | Type | Notes |
|---|---|---|
| `id` | text PK | UUID |
| `userId` | text FK → user | cascade delete |
| `title` | text NOT NULL | |
| `director` | text | |
| `year` | integer | |
| `posterUrl` | text | |
| `format` | text | "Blu-ray", "DVD", or "Digital" — manual, not from API |
| `genre` | text | auto-populated from OMDb |
| `runtime` | integer | minutes, auto-populated |
| `description` | text | auto-populated |
| `createdAt` | timestamp | defaultNow |

**`game`**
| Column | Type | Notes |
|---|---|---|
| `id` | text PK | UUID |
| `userId` | text FK → user | cascade delete |
| `title` | text NOT NULL | |
| `coverUrl` | text | auto-populated from BGG |
| `minPlayers` | integer | auto-populated |
| `maxPlayers` | integer | auto-populated |
| `ageRating` | text | auto-populated; BGG returns minimum age as integer, stored as "N+" string (e.g. "10+") |
| `genre` | text | auto-populated |
| `description` | text | auto-populated |
| `createdAt` | timestamp | defaultNow |

**`lendableItem`**
| Column | Type | Notes |
|---|---|---|
| `id` | text PK | UUID |
| `userId` | text FK → user | cascade delete |
| `type` | text NOT NULL | "book" \| "movie" \| "game" |
| `refId` | text NOT NULL | id of the book/movie/game row |

Unique constraint on `(type, refId)` — prevents registering the same item twice.

### Modified tables

**`book`** — adds `genre` (text, nullable). All other columns unchanged.

**`checkout`** — rebuilt: `bookId` removed, replaced with `lendableItemId` (text FK → lendableItem, cascade delete). All other columns (`contactId`, `checkedOutAt`, `dueDate`, `returnedAt`, `notes`) unchanged.

> Existing checkout data is test data only and will be cleared by the migration.

### Lifecycle

When a book, movie, or game is **created** (manually or via CSV import), a corresponding `lendableItem` row is inserted in the same server action. When the item is **deleted**, the `lendableItem` row cascades automatically (FK cascade delete).

---

## External API Integrations

### Movies — OMDb API

- **Why OMDb over TMDB:** OMDb is commercial-friendly on paid plans; TMDB requires a separate written agreement for any commercial use.
- **Auth:** API key via `OMDB_API_KEY` environment variable.
- **Search:** `GET https://www.omdbapi.com/?s={title}&apikey={key}` — returns title, year, poster, IMDb ID.
- **Detail:** `GET https://www.omdbapi.com/?i={imdbId}&apikey={key}` — returns director, genre, runtime (as "N min" string, parsed to integer), plot (description), poster URL.
- **Manual field:** `format` (Blu-ray / DVD / Digital) — not available from any API, user selects from a dropdown.
- **Integration file:** `lib/omdb.ts`

### Games — BoardGameGeek XML API2

- **Why BGG:** Free, no API key required, comprehensive board/card game database.
- **Search:** `GET https://boardgamegeek.com/xmlapi2/search?query={title}&type=boardgame` — returns list of matches with BGG IDs.
- **Detail:** `GET https://boardgamegeek.com/xmlapi2/thing?id={id}&stats=1` — returns name, image, minPlayers, maxPlayers, age, description, categories (used as genre).
- **XML parsing:** Handled client-side with `DOMParser`, consistent with the barcode scanner approach.
- **Integration file:** `lib/bgg.ts`

### UX pattern (both)

Title field triggers a debounced search → dropdown of suggestions → user selects → all auto-fillable fields populate. Only the manual field (format for movies; none for games) requires user input after selection.

---

## Routes & Components

### Routes

```
app/(library)/
  movies/
    page.tsx               # collection list
    new/page.tsx
    [id]/page.tsx          # detail view
    [id]/edit/page.tsx
    import/page.tsx        # CSV import
    bulk-edit/page.tsx     # post-import enrichment
  games/
    page.tsx
    new/page.tsx
    [id]/page.tsx
    [id]/edit/page.tsx
    import/page.tsx
    bulk-edit/page.tsx
```

### Components

```
components/
  movies/
    movie-form.tsx         # search → auto-fill + format dropdown
    movies-list.tsx
    delete-movie-form.tsx
    movie-bulk-edit.tsx
  games/
    game-form.tsx          # search → auto-fill (all fields)
    games-list.tsx
    delete-game-form.tsx
    game-bulk-edit.tsx
```

### Server-side

```
lib/
  omdb.ts
  bgg.ts
  actions/movies.ts        # createMovie, updateMovie, deleteMovie, importMovies
  actions/games.ts         # createGame, updateGame, deleteGame, importGames
  queries/movies.ts
  queries/games.ts
```

---

## Navigation

Two new entries added to `nav.tsx` between Books and Contacts: **Movies** and **Games**. Nav order: Home → Books → Movies → Games → Contacts → Checkouts.

> **Mobile nav note:** The current mobile bottom tab bar has 4 links + user menu (5 items). Adding Movies and Games brings this to 7 items, which is too many for a tab bar. The mobile nav will need to either hide labels and show icons only, collapse Contacts/Checkouts into a secondary screen, or switch to a hamburger/drawer pattern. This should be resolved during implementation.

---

## Dashboard

Stats row expands to 6 cards:

```
Books | Movies | Games | Checked Out | Overdue | Contacts
```

**Currently out** list: unified across all three collection types. Each row shows a small type pill (Book / Movie / Game) alongside the item title, borrower, and due date.

**Recent activity** feed: same — unified, tagged by type.

**Empty state** (zero items across all collections): unchanged — prompts adding a book first.

---

## Checkout System

### Form changes

- "Check Out a Book" → "Check Out an Item"
- Checkout form: two-step item selector — first pick collection type (Book / Movie / Game), then search/select the specific item.
- Everything else (contact picker, due date, notes, return flow) unchanged.

### Backend changes

- `checkout` table rebuilt with `lendableItemId` replacing `bookId`.
- Queries that join through `lendableItem` to resolve the item title and type for display.
- Migration clears existing checkout rows (test data only) and recreates the table.

### Checkouts list page

Shows all active loans regardless of type. History section same — unified with type tags.
