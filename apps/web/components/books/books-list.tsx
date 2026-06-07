"use client"

import { useState } from "react"
import Link from "next/link"
import type { BookWithAvailability } from "@/lib/queries/books"

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
          className="w-full max-w-sm rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-400"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-zinc-500 dark:text-zinc-400">
          {query
            ? "No books match your search."
            : "No books yet. Add your first book to get started."}
        </p>
      ) : (
        <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {filtered.map((book) => (
            <li key={book.id}>
              <div className="flex items-center justify-between px-5 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-950">
                <Link
                  href={`/books/${book.id}`}
                  className="flex min-w-0 flex-1 items-center gap-4"
                >
                  {book.coverUrl ? (
                    <img
                      src={book.coverUrl}
                      alt=""
                      className="h-14 w-10 flex-shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="h-14 w-10 flex-shrink-0 rounded bg-zinc-100 dark:bg-zinc-800" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">{book.title}</p>
                    {book.authors && (
                      <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">{book.authors}</p>
                    )}
                  </div>
                </Link>
                <div className="ml-4 flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      book.isCheckedOut
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {book.isCheckedOut ? "Checked out" : "Available"}
                  </span>
                  {!book.isCheckedOut && (
                    <Link
                      href={`/checkouts/new?bookId=${book.id}`}
                      className="rounded-lg border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-950"
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
