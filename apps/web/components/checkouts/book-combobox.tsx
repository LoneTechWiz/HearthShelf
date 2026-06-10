"use client"

import { useEffect, useRef, useState } from "react"
import { inputClass } from "@/components/ui/classes"

interface Book {
  id: string
  title: string
}

interface BookComboboxProps {
  books: Book[]
  defaultBookId?: string
}

export function BookCombobox({ books, defaultBookId }: BookComboboxProps) {
  const defaultBook = books.find((b) => b.id === defaultBookId) ?? null
  const [query, setQuery] = useState(defaultBook?.title ?? "")
  const [selected, setSelected] = useState<Book | null>(defaultBook)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = query
    ? books.filter((b) => b.title.toLowerCase().includes(query.toLowerCase()))
    : books

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [])

  function handleSelect(book: Book) {
    setSelected(book)
    setQuery(book.title)
    setOpen(false)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value)
    setSelected(null)
    setOpen(true)
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={() => setOpen(true)}
        placeholder="Search for a book…"
        autoComplete="off"
        className={`w-full ${inputClass}`}
      />
      <input type="hidden" name="bookId" value={selected?.id ?? ""} />
      {open && filtered.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border-edge bg-surface shadow-md">
          {filtered.map((book) => (
            <li key={book.id}>
              <button
                type="button"
                onPointerDown={() => handleSelect(book)}
                className="w-full px-3 py-2 text-left text-sm text-ink hover:bg-surface-raised"
              >
                {book.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
