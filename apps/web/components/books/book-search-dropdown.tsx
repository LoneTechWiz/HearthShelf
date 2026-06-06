"use client"

import { useEffect, useRef } from "react"
import type { BookSuggestion } from "@/lib/open-library"

interface BookSearchDropdownProps {
  suggestions: BookSuggestion[]
  isSearching: boolean
  onSelect: (suggestion: BookSuggestion) => void
  onClose: () => void
}

export function BookSearchDropdown({
  suggestions,
  isSearching,
  onSelect,
  onClose,
}: BookSearchDropdownProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleMouseDown)
    return () => document.removeEventListener("mousedown", handleMouseDown)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute z-10 mt-1 w-full rounded-lg border border-zinc-200 bg-white shadow-lg"
    >
      {isSearching ? (
        <div className="px-3 py-2 text-sm text-zinc-500">Searching…</div>
      ) : suggestions.length === 0 ? (
        <div className="px-3 py-2 text-sm text-zinc-500">No books found</div>
      ) : (
        <ul>
          {suggestions.map((s) => (
            <li key={s.isbn}>
              <button
                type="button"
                onClick={() => onSelect(s)}
                className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-zinc-50"
              >
                {s.coverUrl ? (
                  <img src={s.coverUrl} alt="" className="h-10 w-7 flex-shrink-0 rounded object-cover" />
                ) : (
                  <div className="h-10 w-7 flex-shrink-0 rounded bg-zinc-100" />
                )}
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium text-zinc-900">{s.title}</span>
                  <span className="truncate text-xs text-zinc-500">{s.authors}</span>
                  <span className="text-xs text-zinc-400">{s.isbn}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
