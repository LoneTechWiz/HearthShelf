"use client"

import { useEffect, useRef, useState } from "react"

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
        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-zinc-400"
      />
      <input type="hidden" name="bookId" value={selected?.id ?? ""} />
      {open && filtered.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          {filtered.map((book) => (
            <li key={book.id}>
              <button
                type="button"
                onPointerDown={() => handleSelect(book)}
                className="w-full px-3 py-2 text-left text-sm text-zinc-900 hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-zinc-800"
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
