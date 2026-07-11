"use client"

import { useState } from "react"
import Link from "next/link"
import type { ShelfCollection, CollectionItem } from "@/lib/shelf-collections"
import { EmptyState } from "@/components/ui/empty-state"
import { cardClass, segmentedButtonClass, segmentedGroupClass } from "@/components/ui/classes"

type ShelfType = "books" | "movies" | "games"
type GroupView = "authors" | "series" | "genres" | "categories" | "players"

type ShelfCollectionsData = {
  books: { authors: ShelfCollection[]; series: ShelfCollection[] }
  movies: { series: ShelfCollection[]; genres: ShelfCollection[] }
  games: { categories: ShelfCollection[]; players: ShelfCollection[] }
}

const shelfIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 6.75h15M4.5 12h15M4.5 17.25h15" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 4.5h3v4.5h-3zM13.5 9.75h3v4.5h-3zM8.25 15h3v4.5h-3z" />
  </svg>
)

const shelfLabels: Record<ShelfType, string> = {
  books: "Books",
  movies: "Movies",
  games: "Games",
}

const groupOptions: Record<ShelfType, Array<{ key: GroupView; label: string }>> = {
  books: [
    { key: "authors", label: "Authors" },
    { key: "series", label: "Series" },
  ],
  movies: [
    { key: "series", label: "Series" },
    { key: "genres", label: "Genres" },
  ],
  games: [
    { key: "categories", label: "Categories" },
    { key: "players", label: "Players" },
  ],
}

function collectionsForView(data: ShelfCollectionsData, shelf: ShelfType, view: GroupView): ShelfCollection[] {
  if (shelf === "books") return view === "series" ? data.books.series : data.books.authors
  if (shelf === "movies") return view === "genres" ? data.movies.genres : data.movies.series
  return view === "players" ? data.games.players : data.games.categories
}

function ItemRow({ item }: { item: CollectionItem }) {
  return (
    <li>
      <Link
        href={item.href}
        className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-surface-raised"
      >
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt="" className="h-12 w-8 flex-shrink-0 rounded border border-edge object-cover" />
        ) : (
          <div className="flex h-12 w-8 flex-shrink-0 items-center justify-center rounded border border-edge bg-surface-raised text-ink-faint [&>svg]:h-4 [&>svg]:w-4">
            {shelfIcon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">
            {item.position ? `${item.position}. ` : ""}
            {item.title}
          </p>
          {item.subtitle && <p className="truncate text-xs text-ink-muted">{item.subtitle}</p>}
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

function CollectionCard({ collection, shelf }: { collection: ShelfCollection; shelf: ShelfType }) {
  const denominator = collection.totalCount
  const percent = denominator ? Math.min(100, Math.round((collection.ownedCount / denominator) * 100)) : null
  const itemLabel = shelf === "books" ? "book" : shelf === "movies" ? "movie" : "game"

  return (
    <article className={`${cardClass} p-4`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate font-display text-lg font-semibold text-ink">{collection.name}</h2>
          <p className="text-sm text-ink-muted">
            {denominator
              ? `${collection.ownedCount} of ${denominator} ${itemLabel}s`
              : `${collection.ownedCount} unique ${itemLabel}${collection.ownedCount === 1 ? "" : "s"}`}
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
        {collection.items.map((item) => (
          <ItemRow key={item.identity} item={item} />
        ))}
      </ul>
    </article>
  )
}

export function ShelfCollections({ data }: { data: ShelfCollectionsData }) {
  const [shelf, setShelf] = useState<ShelfType>("books")
  const [views, setViews] = useState<Record<ShelfType, GroupView>>({
    books: "authors",
    movies: "series",
    games: "categories",
  })
  const view = views[shelf]
  const collections = collectionsForView(data, shelf, view)

  function changeShelf(nextShelf: ShelfType) {
    setShelf(nextShelf)
  }

  function changeView(nextView: GroupView) {
    setViews((current) => ({ ...current, [shelf]: nextView }))
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className={segmentedGroupClass} role="group" aria-label="Shelf type">
          {(["books", "movies", "games"] as const).map((nextShelf) => (
            <button
              key={nextShelf}
              type="button"
              onClick={() => changeShelf(nextShelf)}
              aria-pressed={shelf === nextShelf}
              className={segmentedButtonClass(shelf === nextShelf)}
            >
              {shelfLabels[nextShelf]}
            </button>
          ))}
        </div>

        <div className={segmentedGroupClass} role="group" aria-label="Collection grouping">
          {groupOptions[shelf].map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => changeView(option.key)}
              aria-pressed={view === option.key}
              className={segmentedButtonClass(view === option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {collections.length === 0 ? (
        <EmptyState
          icon={shelfIcon}
          title={`No ${shelfLabels[shelf].toLowerCase()} collections yet`}
          description={`Add metadata to your ${shelfLabels[shelf].toLowerCase()} to build grouped collections.`}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {collections.map((collection) => (
            <CollectionCard key={collection.name} collection={collection} shelf={shelf} />
          ))}
        </div>
      )}
    </>
  )
}
