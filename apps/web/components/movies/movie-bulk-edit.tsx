"use client"

import { useActionState, useState } from "react"
import { bulkUpdateMovies } from "@/lib/actions/movies"
import { inputClass, btnPrimary } from "@/components/ui/classes"

type Row = {
  id: string
  title: string
  director: string
  year: string
  format: string
  genre: string
  runtime: string
  description: string
  posterUrl: string
}

interface MovieBulkEditProps {
  movies: Array<{
    id: string
    title: string
    director: string | null
    year: number | null
    format: string | null
    genre: string | null
    runtime: number | null
    description: string | null
    posterUrl: string | null
  }>
}

const FORMAT_OPTIONS = ["", "Blu-ray", "DVD", "Digital"]

export function MovieBulkEdit({ movies }: MovieBulkEditProps) {
  const [state, formAction, isPending] = useActionState(bulkUpdateMovies, null)
  const [rows, setRows] = useState<Row[]>(() =>
    movies.map((m) => ({
      id: m.id,
      title: m.title,
      director: m.director ?? "",
      year: String(m.year ?? ""),
      format: m.format ?? "",
      genre: m.genre ?? "",
      runtime: String(m.runtime ?? ""),
      description: m.description ?? "",
      posterUrl: m.posterUrl ?? "",
    }))
  )

  function update(id: string, field: keyof Row, value: string) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  }

  if (rows.length === 0) return <p className="text-ink-muted">No movies to edit.</p>

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="rows" value={JSON.stringify(rows)} />
      <div className="overflow-x-auto rounded-xl border border-edge bg-surface shadow-sm">
        <table className="w-full table-fixed text-left text-sm">
          <thead className="bg-surface-raised text-ink-muted">
            <tr>
              <th className="px-2 py-1.5 font-medium">Title</th>
              <th className="w-32 px-2 py-1.5 font-medium">Director</th>
              <th className="w-16 px-2 py-1.5 font-medium">Year</th>
              <th className="w-24 px-2 py-1.5 font-medium">Format</th>
              <th className="w-24 px-2 py-1.5 font-medium">Genre</th>
              <th className="w-16 px-2 py-1.5 font-medium">Min</th>
              <th className="w-64 px-2 py-1.5 font-medium">Description</th>
              <th className="px-2 py-1.5 font-medium">Poster URL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-edge">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-2 py-1.5">
                  <input aria-label={`Title for ${row.id}`} value={row.title}
                    onChange={(e) => update(row.id, "title", e.target.value)} className={`${inputClass} w-full`} />
                </td>
                <td className="w-32 px-2 py-1.5">
                  <input aria-label={`Director for ${row.id}`} value={row.director}
                    onChange={(e) => update(row.id, "director", e.target.value)} className={`${inputClass} w-full`} />
                </td>
                <td className="w-16 px-2 py-1.5">
                  <input aria-label={`Year for ${row.id}`} value={row.year} type="number"
                    onChange={(e) => update(row.id, "year", e.target.value)} className={`${inputClass} w-full`} />
                </td>
                <td className="w-24 px-2 py-1.5">
                  <select aria-label={`Format for ${row.id}`} value={row.format}
                    onChange={(e) => update(row.id, "format", e.target.value)} className={`${inputClass} w-full`}>
                    {FORMAT_OPTIONS.map((f) => <option key={f} value={f}>{f || "—"}</option>)}
                  </select>
                </td>
                <td className="w-24 px-2 py-1.5">
                  <input aria-label={`Genre for ${row.id}`} value={row.genre}
                    onChange={(e) => update(row.id, "genre", e.target.value)} className={`${inputClass} w-full`} />
                </td>
                <td className="w-16 px-2 py-1.5">
                  <input aria-label={`Runtime for ${row.id}`} value={row.runtime} type="number"
                    onChange={(e) => update(row.id, "runtime", e.target.value)} className={`${inputClass} w-full`} />
                </td>
                <td className="w-64 px-2 py-1.5">
                  <textarea aria-label={`Description for ${row.id}`} value={row.description} rows={2}
                    onChange={(e) => update(row.id, "description", e.target.value)} className={`${inputClass} w-full resize-y`} />
                </td>
                <td className="px-2 py-1.5">
                  <input aria-label={`Poster URL for ${row.id}`} value={row.posterUrl}
                    onChange={(e) => update(row.id, "posterUrl", e.target.value)} className={`${inputClass} w-full`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={isPending} className={`${btnPrimary} self-start`}>
          {isPending ? "Saving…" : "Save all"}
        </button>
        {state && "updated" in state && (
          <span className="text-sm text-ink-muted">Saved {state.updated} movie{state.updated === 1 ? "" : "s"}.</span>
        )}
        {state && "error" in state && (
          <span className="text-sm text-red-600 dark:text-red-400">{state.error}</span>
        )}
      </div>
    </form>
  )
}
