"use client"

import { useState } from "react"
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

  const filtered = query
    ? books.filter(
        (b) =>
          b.title.toLowerCase().includes(query.toLowerCase()) ||
          (b.authors?.toLowerCase().includes(query.toLowerCase()) ?? false)
      )
    : books

  return (
    <>
      <div className="mb-4">
        <input
          type="search"
          placeholder="Search books…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`w-full max-w-sm ${inputClass}`}
        />
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
      ) : (
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
                    <div className="flex h-14 w-10 flex-shrink-0 items-center justify-center rounded border border-edge bg-surface-raised">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5 text-ink-faint" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                      </svg>
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
      )}
    </>
  )
}
