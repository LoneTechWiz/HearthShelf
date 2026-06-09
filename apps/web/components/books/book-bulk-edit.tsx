"use client"

import { useActionState, useState } from "react"
import { lookupByIsbn } from "@/lib/open-library"
import { bulkUpdateBooks } from "@/lib/actions/books"

type Row = {
  id: string
  title: string
  authors: string
  isbn: string
  description: string
  coverUrl: string
}

interface BookBulkEditProps {
  books: Array<{
    id: string
    title: string
    authors: string | null
    isbn: string | null
    description: string | null
    coverUrl: string | null
  }>
}

export function BookBulkEdit({ books }: BookBulkEditProps) {
  const [state, formAction, isPending] = useActionState(bulkUpdateBooks, null)
  const [rows, setRows] = useState<Row[]>(() =>
    books.map((b) => ({
      id: b.id,
      title: b.title,
      authors: b.authors ?? "",
      isbn: b.isbn ?? "",
      description: b.description ?? "",
      coverUrl: b.coverUrl ?? "",
    }))
  )
  const [lookingUp, setLookingUp] = useState<string | null>(null)

  function update(id: string, field: keyof Row, value: string) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  }

  // Fill only the empty fields from an ISBN lookup; never overwrite user input.
  async function handleLookup(id: string) {
    const row = rows.find((r) => r.id === id)
    if (!row?.isbn) return
    setLookingUp(id)
    try {
      const result = await lookupByIsbn(row.isbn)
      if (!result) return
      setRows((rs) =>
        rs.map((r) =>
          r.id === id
            ? {
                ...r,
                authors: r.authors || result.authors,
                coverUrl: r.coverUrl || (result.coverUrl ?? ""),
                description: r.description || (result.description ?? ""),
              }
            : r
        )
      )
    } finally {
      setLookingUp(null)
    }
  }

  if (rows.length === 0) {
    return <p className="text-zinc-500 dark:text-zinc-400">No books to edit.</p>
  }

  const inputClass =
    "w-full rounded-md border border-zinc-300 px-2 py-1 text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="rows" value={JSON.stringify(rows)} />

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="px-3 py-2 font-medium">Title</th>
              <th className="px-3 py-2 font-medium">Author(s)</th>
              <th className="px-3 py-2 font-medium">ISBN</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-3 py-2">
                  <input
                    aria-label={`Title for ${row.id}`}
                    value={row.title}
                    onChange={(e) => update(row.id, "title", e.target.value)}
                    className={inputClass}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    aria-label={`Authors for ${row.id}`}
                    value={row.authors}
                    onChange={(e) => update(row.id, "authors", e.target.value)}
                    className={inputClass}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    aria-label={`ISBN for ${row.id}`}
                    value={row.isbn}
                    onChange={(e) => update(row.id, "isbn", e.target.value)}
                    className={inputClass}
                  />
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => handleLookup(row.id)}
                    disabled={!row.isbn || lookingUp === row.id}
                    className="rounded-md border border-zinc-300 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    {lookingUp === row.id ? "Looking up…" : "Lookup"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="self-start rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {isPending ? "Saving…" : "Save all"}
        </button>
        {state && "updated" in state && (
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            Saved {state.updated} book{state.updated === 1 ? "" : "s"}.
          </span>
        )}
        {state && "error" in state && (
          <span className="text-sm text-red-600 dark:text-red-400">{state.error}</span>
        )}
      </div>
    </form>
  )
}
