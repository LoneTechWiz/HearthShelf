"use client"

import Link from "next/link"
import { useState } from "react"
import type { BookWithAvailability } from "@/lib/queries/books"
import type { MovieWithAvailability } from "@/lib/queries/movies"
import type { GameWithAvailability } from "@/lib/queries/games"
import { BooksList } from "@/components/books/books-list"
import { MoviesList } from "@/components/movies/movies-list"
import { GamesList } from "@/components/games/games-list"
import { btnPrimary, btnSecondary } from "@/components/ui/classes"

type ShelfType = "books" | "movies" | "games"

const labels: Record<ShelfType, string> = {
  books: "Books",
  movies: "Movies",
  games: "Games",
}

export function ShelfView({
  books,
  movies,
  games,
  initialShelf = "books",
}: {
  books: BookWithAvailability[]
  movies: MovieWithAvailability[]
  games: GameWithAvailability[]
  initialShelf?: ShelfType
}) {
  const [shelf, setShelf] = useState<ShelfType>(initialShelf)
  const count = shelf === "books" ? books.length : shelf === "movies" ? movies.length : games.length
  const singular = shelf === "books" ? "book" : shelf === "movies" ? "movie" : "game"
  const baseHref = shelf === "books" ? "/books" : shelf === "movies" ? "/movies" : "/games"

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Shelf</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            {count} {count === 1 ? singular : `${singular}s`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`${baseHref}/bulk-edit`} className={btnSecondary}>Bulk edit</Link>
          <Link href={`${baseHref}/import`} className={btnSecondary}>Import CSV</Link>
          <Link href={`${baseHref}/new`} className={btnPrimary}>Add {labels[shelf].slice(0, -1)}</Link>
        </div>
      </div>

      <div className="mb-4 flex rounded-lg border border-edge bg-surface p-0.5 sm:w-fit" role="group" aria-label="Shelf type">
        {(["books", "movies", "games"] as const).map((nextShelf) => (
          <button
            key={nextShelf}
            type="button"
            onClick={() => setShelf(nextShelf)}
            aria-pressed={shelf === nextShelf}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors sm:flex-none ${
              shelf === nextShelf ? "bg-accent-soft text-accent" : "text-ink-muted hover:text-ink"
            }`}
          >
            {labels[nextShelf]}
          </button>
        ))}
      </div>

      {shelf === "books" ? (
        <BooksList books={books} />
      ) : shelf === "movies" ? (
        <MoviesList movies={movies} />
      ) : (
        <GamesList games={games} />
      )}
    </div>
  )
}
