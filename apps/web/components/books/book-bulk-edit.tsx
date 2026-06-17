"use client"

import { useActionState, useState } from "react"
import { lookupByIsbn } from "@/lib/open-library"
import { bulkUpdateBooks } from "@/lib/actions/books"
import { inputClass, btnPrimary, btnSecondarySm } from "@/components/ui/classes"

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
    return <p className="text-ink-muted">No books to edit.</p>
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="rows" value={JSON.stringify(rows)} />

      <div className="overflow-x-auto rounded-xl border border-edge bg-surface shadow-sm">
        <table className="w-full table-fixed text-left text-sm">
          <thead className="bg-surface-raised text-ink-muted">
            <tr>
              <th className="px-2 py-1.5 font-medium">Title</th>
              <th className="w-36 px-2 py-1.5 font-medium">Author(s)</th>
              <th className="w-28 px-2 py-1.5 font-medium">ISBN</th>
              <th className="w-80 px-2 py-1.5 font-medium">Description</th>
              <th className="px-2 py-1.5 font-medium">Cover URL</th>
              <th className="px-2 py-1.5 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-edge">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-2 py-1.5">
                  <input
                    aria-label={`Title for ${row.id}`}
                    value={row.title}
                    onChange={(e) => update(row.id, "title", e.target.value)}
                    className={`${inputClass} w-full`}
                  />
                </td>
                <td className="w-36 px-2 py-1.5">
                  <input
                    aria-label={`Authors for ${row.id}`}
                    value={row.authors}
                    onChange={(e) => update(row.id, "authors", e.target.value)}
                    className={`${inputClass} w-full`}
                  />
                </td>
                <td className="w-28 px-2 py-1.5">
                  <input
                    aria-label={`ISBN for ${row.id}`}
                    value={row.isbn}
                    onChange={(e) => update(row.id, "isbn", e.target.value)}
                    className={`${inputClass} w-full`}
                  />
                </td>
                <td className="w-80 px-2 py-1.5">
                  <textarea
                    aria-label={`Description for ${row.id}`}
                    value={row.description}
                    onChange={(e) => update(row.id, "description", e.target.value)}
                    rows={2}
                    className={`${inputClass} w-full resize-y`}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    aria-label={`Cover URL for ${row.id}`}
                    value={row.coverUrl}
                    onChange={(e) => update(row.id, "coverUrl", e.target.value)}
                    className={`${inputClass} w-full`}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <button
                    type="button"
                    onClick={() => handleLookup(row.id)}
                    disabled={!row.isbn || lookingUp === row.id}
                    className={btnSecondarySm}
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
          className={`${btnPrimary} self-start`}
        >
          {isPending ? "Saving…" : "Save all"}
        </button>
        {state && "updated" in state && (
          <span className="text-sm text-ink-muted">
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
