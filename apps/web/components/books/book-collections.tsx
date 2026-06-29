"use client"

import { useState } from "react"
import Link from "next/link"
import type { AuthorCollection, SeriesCollection, CollectionItem } from "@/lib/book-collections"
import { EmptyState } from "@/components/ui/empty-state"

const bookIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
  </svg>
)

function BookRow({ item }: { item: CollectionItem }) {
  return (
    <li>
      <Link
        href={`/books/${item.bookIds[0]}`}
        className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-surface-raised"
      >
        {item.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.coverUrl} alt="" className="h-12 w-8 flex-shrink-0 rounded border border-edge object-cover" />
        ) : (
          <div className="flex h-12 w-8 flex-shrink-0 items-center justify-center rounded border border-edge bg-surface-raised text-ink-faint [&>svg]:h-4 [&>svg]:w-4">
            {bookIcon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">
            {item.seriesPosition ? `${item.seriesPosition}. ` : ""}
            {item.title}
          </p>
          {item.authors && <p className="truncate text-xs text-ink-muted">{item.authors}</p>}
        </div>
        {item.copyCount > 1 && (
          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
            {item.copyCount} copies
          </span>
        )}
      </Link>
    </li>
  )
}

function SeriesCard({ collection }: { collection: SeriesCollection }) {
  const denominator = collection.totalCount
  const percent = denominator ? Math.min(100, Math.round((collection.ownedCount / denominator) * 100)) : null

  return (
    <article className="rounded-xl border border-edge bg-surface p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate font-display text-lg font-semibold text-ink">{collection.seriesName}</h2>
          <p className="text-sm text-ink-muted">
            {denominator
              ? `${collection.ownedCount} of ${denominator} books`
              : `${collection.ownedCount} owned, total unknown`}
          </p>
        </div>
        {percent !== null && (
          <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent">
            {percent}%
          </span>
        )}
      </div>
      {denominator && (
        <div className="mb-3 h-2 rounded-full bg-surface-raised">
          <div className="h-2 rounded-full bg-accent" style={{ width: `${percent}%` }} />
        </div>
      )}
      <ul className="divide-y divide-edge">
        {collection.books.map((item) => (
          <BookRow key={item.identity} item={item} />
        ))}
      </ul>
    </article>
  )
}

function AuthorCard({ collection }: { collection: AuthorCollection }) {
  return (
    <article className="rounded-xl border border-edge bg-surface p-4 shadow-sm">
      <div className="mb-3">
        <h2 className="truncate font-display text-lg font-semibold text-ink">{collection.author}</h2>
        <p className="text-sm text-ink-muted">
          {collection.ownedCount} unique book{collection.ownedCount === 1 ? "" : "s"}
        </p>
      </div>
      <ul className="divide-y divide-edge">
        {collection.books.map((item) => (
          <BookRow key={item.identity} item={item} />
        ))}
      </ul>
    </article>
  )
}

export function BookCollections({
  authorCollections,
  seriesCollections,
}: {
  authorCollections: AuthorCollection[]
  seriesCollections: SeriesCollection[]
}) {
  const [view, setView] = useState<"series" | "authors">("authors")
  const isSeries = view === "series"

  return (
    <>
      <div className="mb-4 flex rounded-lg border border-edge bg-surface p-0.5 sm:w-fit" role="group" aria-label="Collection view">
        {(["authors", "series"] as const).map((nextView) => (
          <button
            key={nextView}
            type="button"
            onClick={() => setView(nextView)}
            aria-pressed={view === nextView}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors sm:flex-none ${
              view === nextView ? "bg-accent-soft text-accent" : "text-ink-muted hover:text-ink"
            }`}
          >
            {nextView}
          </button>
        ))}
      </div>

      {isSeries ? (
        seriesCollections.length === 0 ? (
          <EmptyState
            icon={bookIcon}
            title="No series yet"
            description="Add series details to books to track completion."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {seriesCollections.map((collection) => (
              <SeriesCard key={collection.seriesName} collection={collection} />
            ))}
          </div>
        )
      ) : authorCollections.length === 0 ? (
        <EmptyState
          icon={bookIcon}
          title="No authors yet"
          description="Add books with author details to build author collections."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {authorCollections.map((collection) => (
            <AuthorCard key={collection.author} collection={collection} />
          ))}
        </div>
      )}
    </>
  )
}
