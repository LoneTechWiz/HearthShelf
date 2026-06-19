"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import type { MovieWithAvailability } from "@/lib/queries/movies"
import { inputClass, btnPrimary, btnSecondarySm } from "@/components/ui/classes"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"

const filmIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375z" />
  </svg>
)

export function MoviesList({ movies }: { movies: MovieWithAvailability[] }) {
  const [query, setQuery] = useState("")
  const [view, setView] = useState<"list" | "grid">("list")

  useEffect(() => {
    const id = setTimeout(() => {
      if (localStorage.getItem("movies-view") === "grid") setView("grid")
    }, 0)
    return () => clearTimeout(id)
  }, [])

  function changeView(next: "list" | "grid") {
    setView(next)
    localStorage.setItem("movies-view", next)
  }

  const filtered = query
    ? movies.filter(
        (m) =>
          m.title.toLowerCase().includes(query.toLowerCase()) ||
          (m.director?.toLowerCase().includes(query.toLowerCase()) ?? false)
      )
    : movies

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <input type="search" placeholder="Search movies…" value={query}
          onChange={(e) => setQuery(e.target.value)} className={`w-full max-w-sm ${inputClass}`} />
        <div className="flex shrink-0 rounded-lg border border-edge bg-surface p-0.5" role="group" aria-label="View">
          {(["list", "grid"] as const).map((v) => (
            <button key={v} type="button" onClick={() => changeView(v)} aria-pressed={view === v}
              className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                view === v ? "bg-accent-soft text-accent" : "text-ink-muted hover:text-ink"
              }`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        query ? (
          <EmptyState icon={filmIcon} title="No matches" description={`Nothing matches "${query}".`} />
        ) : (
          <EmptyState icon={filmIcon} title="No movies yet"
            description="Add your first movie to start tracking your collection."
            action={<Link href="/movies/new" className={btnPrimary}>Add Movie</Link>} />
        )
      ) : view === "list" ? (
        <ul className="divide-y divide-edge rounded-xl border border-edge bg-surface shadow-sm">
          {filtered.map((movie) => (
            <li key={movie.id}>
              <div className="flex items-center justify-between px-5 py-4 hover:bg-surface-raised">
                <Link href={`/movies/${movie.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                  {movie.posterUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={movie.posterUrl} alt="" className="h-14 w-10 flex-shrink-0 rounded object-cover border border-edge" />
                  ) : (
                    <div className="flex h-14 w-10 flex-shrink-0 items-center justify-center rounded border border-edge bg-surface-raised text-ink-faint [&>svg]:h-5 [&>svg]:w-5">
                      {filmIcon}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{movie.title}</p>
                    {movie.director && <p className="truncate text-sm text-ink-muted">{movie.director}</p>}
                    {movie.year && <p className="truncate text-xs text-ink-faint">{movie.year}</p>}
                  </div>
                </Link>
                <div className="ml-4 flex shrink-0 items-center gap-2">
                  <StatusBadge status={movie.isCheckedOut ? "checked-out" : "available"} />
                  {!movie.isCheckedOut && movie.lendableItemId && (
                    <Link href={`/checkouts/new?lendableItemId=${movie.lendableItemId}`} className={btnSecondarySm}>
                      Check Out
                    </Link>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
          {filtered.map((movie) => (
            <li key={movie.id}>
              <Link href={`/movies/${movie.id}`} className="group block">
                <div className="relative aspect-2/3 overflow-hidden rounded-lg border border-edge bg-surface-raised shadow-sm transition-transform group-hover:-translate-y-0.5">
                  {movie.posterUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={movie.posterUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-center">
                      <span className="font-display text-sm font-semibold text-ink line-clamp-4">{movie.title}</span>
                    </div>
                  )}
                  <span role="img" aria-label={movie.isCheckedOut ? "Checked out" : "Available"}
                    className={`absolute right-2 top-2 h-2.5 w-2.5 rounded-full ring-2 ring-surface ${
                      movie.isCheckedOut ? "bg-amber-500" : "bg-emerald-500"
                    }`} />
                </div>
                <p className="mt-2 truncate text-sm font-medium text-ink">{movie.title}</p>
                {movie.director && <p className="truncate text-xs text-ink-muted">{movie.director}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
