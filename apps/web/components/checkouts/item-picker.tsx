"use client"

import { useEffect, useRef, useState } from "react"
import { inputClass } from "@/components/ui/classes"

type ItemType = "book" | "movie" | "game"

interface LendableItem {
  lendableItemId: string
  title: string
  subtitle?: string | null
}

interface ItemPickerProps {
  books: LendableItem[]
  movies: LendableItem[]
  games: LendableItem[]
  defaultLendableItemId?: string
  defaultType?: ItemType
}

export function ItemPicker({ books, movies, games, defaultLendableItemId, defaultType }: ItemPickerProps) {
  const [activeType, setActiveType] = useState<ItemType>(defaultType ?? "book")
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<LendableItem | null>(() => {
    if (!defaultLendableItemId) return null
    const allItems = [...books, ...movies, ...games]
    return allItems.find((i) => i.lendableItemId === defaultLendableItemId) ?? null
  })
  const containerRef = useRef<HTMLDivElement>(null)

  const itemLists: Record<ItemType, LendableItem[]> = { book: books, movie: movies, game: games }
  const currentList = itemLists[activeType]

  const filtered = query
    ? currentList.filter((i) => i.title.toLowerCase().includes(query.toLowerCase()))
    : currentList

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [])

  function handleTypeChange(type: ItemType) {
    setActiveType(type)
    setSelected(null)
    setQuery("")
    setOpen(false)
  }

  function handleSelect(item: LendableItem) {
    setSelected(item)
    setQuery(item.title)
    setOpen(false)
  }

  const tabLabel: Record<ItemType, string> = { book: "Book", movie: "Movie", game: "Game" }

  return (
    <div className="flex flex-col gap-2">
      {/* Type tabs */}
      <div className="flex rounded-lg border border-edge bg-surface p-0.5 w-fit" role="group" aria-label="Item type">
        {(["book", "movie", "game"] as ItemType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => handleTypeChange(type)}
            aria-pressed={activeType === type}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeType === type ? "bg-accent-soft text-accent" : "text-ink-muted hover:text-ink"
            }`}
          >
            {tabLabel[type]}
          </button>
        ))}
      </div>

      {/* Item combobox */}
      <div ref={containerRef} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelected(null); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={currentList.length === 0 ? `No ${tabLabel[activeType].toLowerCase()}s available` : `Search for a ${tabLabel[activeType].toLowerCase()}…`}
          autoComplete="off"
          disabled={currentList.length === 0}
          className={`w-full ${inputClass}`}
        />
        <input type="hidden" name="lendableItemId" value={selected?.lendableItemId ?? ""} />
        {open && filtered.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-edge bg-surface shadow-md">
            {filtered.map((item) => (
              <li key={item.lendableItemId}>
                <button
                  type="button"
                  onPointerDown={() => handleSelect(item)}
                  className="w-full px-3 py-2 text-left text-sm text-ink hover:bg-surface-raised"
                >
                  <span className="font-medium">{item.title}</span>
                  {item.subtitle && <span className="ml-1 text-ink-muted text-xs">{item.subtitle}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
