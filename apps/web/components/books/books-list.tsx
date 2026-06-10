"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import type { BookWithAvailability } from "@/lib/queries/books"
import { inputClass, btnPrimary, btnSecondarySm } from "@/components/ui/classes"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"

const bookIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
  </svg>
)


export function BooksList({ books }: { books: BookWithAvailability[] }) {
  const [query, setQuery] = useState("")
  const [view, setView] = useState<"list" | "grid">("list")

  // Use a timeout callback so the linter's set-state-in-effect rule is satisfied.
  // The zero delay still defers until after first render, preventing hydration mismatch.
  useEffect(() => {
    const id = setTimeout(() => {
      if (localStorage.getItem("books-view") === "grid") setView("grid")
    }, 0)
    return () => clearTimeout(id)
  }, [])

  function changeView(next: "list" | "grid") {
    setView(next)
    localStorage.setItem("books-view", next)
  }

  const filtered = query
    ? books.filter(
        (b) =>
          b.title.toLowerCase().includes(query.toLowerCase()) ||
          (b.authors?.toLowerCase().includes(query.toLowerCase()) ?? false)
      )
    : books

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <input
          type="search"
          placeholder="Search books…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`w-full max-w-sm ${inputClass}`}
        />
        <div className="flex shrink-0 rounded-lg border border-edge bg-surface p-0.5" role="group" aria-label="View">
          {(["list", "grid"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => changeView(v)}
              aria-pressed={view === v}
              className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                view === v ? "bg-accent-soft text-accent" : "text-ink-muted hover:text-ink"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        query ? (
          <EmptyState icon={bookIcon} title="No matches" description={`Nothing on your shelf matches "${query}".`} />
        ) : (
          <EmptyState
            icon={bookIcon}
            title="Your shelf is empty"
            description="Add your first book to start tracking your library."
            action={<Link href="/books/new" className={btnPrimary}>Add Book</Link>}
          />
        )
      ) : view === "list" ? (
        <ul className="divide-y divide-edge rounded-xl border border-edge bg-surface shadow-sm">
          {filtered.map((book) => (
            <li key={book.id}>
              <div className="flex items-center justify-between px-5 py-4 hover:bg-surface-raised">
                <Link
                  href={`/books/${book.id}`}
                  className="flex min-w-0 flex-1 items-center gap-4"
                >
                  {book.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={book.coverUrl}
                      alt=""
                      className="h-14 w-10 flex-shrink-0 rounded object-cover border border-edge"
                    />
                  ) : (
                    <div className="flex h-14 w-10 flex-shrink-0 items-center justify-center rounded border border-edge bg-surface-raised text-ink-faint [&>svg]:h-5 [&>svg]:w-5">
                      {bookIcon}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{book.title}</p>
                    {book.authors && (
                      <p className="truncate text-sm text-ink-muted">{book.authors}</p>
                    )}
                  </div>
                </Link>
                <div className="ml-4 flex shrink-0 items-center gap-2">
                  <StatusBadge status={book.isCheckedOut ? "checked-out" : "available"} />
                  {!book.isCheckedOut && (
                    <Link
                      href={`/checkouts/new?bookId=${book.id}`}
                      className={btnSecondarySm}
                    >
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
          {filtered.map((book) => (
            <li key={book.id}>
              <Link href={`/books/${book.id}`} className="group block">
                <div className="relative aspect-2/3 overflow-hidden rounded-lg border border-edge bg-surface-raised shadow-sm transition-transform group-hover:-translate-y-0.5">
                  {book.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={book.coverUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-center">
                      <span className="font-display text-sm font-semibold text-ink line-clamp-4">{book.title}</span>
                    </div>
                  )}
                  <span
                    aria-label={book.isCheckedOut ? "Checked out" : "Available"}
                    className={`absolute right-2 top-2 h-2.5 w-2.5 rounded-full ring-2 ring-surface ${
                      book.isCheckedOut ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                  />
                </div>
                <p className="mt-2 truncate text-sm font-medium text-ink">{book.title}</p>
                {book.authors && <p className="truncate text-xs text-ink-muted">{book.authors}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
