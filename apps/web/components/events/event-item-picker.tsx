"use client"

import { useMemo, useState } from "react"

type ItemType = "book" | "movie" | "game"

type LendableItem = {
  lendableItemId: string
  title: string
  subtitle?: string | null
}

export function EventItemPicker({
  books,
  movies,
  games,
}: {
  books: LendableItem[]
  movies: LendableItem[]
  games: LendableItem[]
}) {
  const [activeType, setActiveType] = useState<ItemType>("book")
  const [query, setQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const lists: Record<ItemType, LendableItem[]> = { book: books, movie: movies, game: games }
  const labels: Record<ItemType, string> = { book: "Books", movie: "Movies", game: "Games" }
  const currentList = lists[activeType]
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return currentList
    return currentList.filter((item) => item.title.toLowerCase().includes(normalized))
  }, [currentList, query])
  const selectedIdList = Array.from(selectedIds)

  function toggleSelected(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {selectedIdList.map((id) => (
        <input key={id} type="hidden" name="lendableItemIds" value={id} />
      ))}

      <div className="flex rounded-lg border border-edge bg-surface p-0.5 w-fit" role="group" aria-label="Item type">
        {(["book", "movie", "game"] as ItemType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => {
              setActiveType(type)
              setQuery("")
            }}
            aria-pressed={activeType === type}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeType === type ? "bg-accent-soft text-accent" : "text-ink-muted hover:text-ink"
            }`}
          >
            {labels[type]}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        aria-label={`Search ${labels[activeType].toLowerCase()}`}
        placeholder={`Search ${labels[activeType].toLowerCase()}...`}
        className="rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent"
      />

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-edge px-3 py-4 text-sm text-ink-muted">
          No {labels[activeType].toLowerCase()} found.
        </p>
      ) : (
        <div className="max-h-64 overflow-auto rounded-lg border border-edge bg-surface">
          {filtered.map((item) => (
            <label
              key={item.lendableItemId}
              className="flex cursor-pointer items-start gap-3 border-b border-edge px-3 py-2 last:border-b-0 hover:bg-surface-raised"
            >
              <input
                type="checkbox"
                checked={selectedIds.has(item.lendableItemId)}
                onChange={() => toggleSelected(item.lendableItemId)}
                className="mt-1 h-4 w-4 rounded border-edge text-accent focus:ring-accent"
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-ink">{item.title}</span>
                {item.subtitle && (
                  <span className="block truncate text-xs text-ink-muted">{item.subtitle}</span>
                )}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
