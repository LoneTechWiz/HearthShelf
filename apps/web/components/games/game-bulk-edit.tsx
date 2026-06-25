"use client"

import { useActionState, useState } from "react"
import { bulkUpdateGames } from "@/lib/actions/games"
import { inputClass, btnPrimary } from "@/components/ui/classes"

type Row = {
  id: string
  title: string
  minPlayers: string
  maxPlayers: string
  ageRating: string
  genre: string
  description: string
  coverUrl: string
}

interface GameBulkEditProps {
  games: Array<{
    id: string
    title: string
    minPlayers: number | null
    maxPlayers: number | null
    ageRating: string | null
    genre: string | null
    description: string | null
    coverUrl: string | null
  }>
}

export function GameBulkEdit({ games }: GameBulkEditProps) {
  const [state, formAction, isPending] = useActionState(bulkUpdateGames, null)
  const [rows, setRows] = useState<Row[]>(() =>
    games.map((g) => ({
      id: g.id,
      title: g.title,
      minPlayers: String(g.minPlayers ?? ""),
      maxPlayers: String(g.maxPlayers ?? ""),
      ageRating: g.ageRating ?? "",
      genre: g.genre ?? "",
      description: g.description ?? "",
      coverUrl: g.coverUrl ?? "",
    }))
  )

  function update(id: string, field: keyof Row, value: string) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  }

  if (rows.length === 0) return <p className="text-ink-muted">No games to edit.</p>

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="rows" value={JSON.stringify(rows)} />
      <div className="overflow-x-auto rounded-xl border border-edge bg-surface shadow-sm">
        <table className="w-full table-fixed text-left text-sm">
          <thead className="bg-surface-raised text-ink-muted">
            <tr>
              <th className="px-2 py-1.5 font-medium">Title</th>
              <th className="w-16 px-2 py-1.5 font-medium">Min</th>
              <th className="w-16 px-2 py-1.5 font-medium">Max</th>
              <th className="w-20 px-2 py-1.5 font-medium">Age</th>
              <th className="w-24 px-2 py-1.5 font-medium">Genre</th>
              <th className="w-64 px-2 py-1.5 font-medium">Description</th>
              <th className="px-2 py-1.5 font-medium">Cover URL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-edge">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-2 py-1.5">
                  <input aria-label={`Title for ${row.id}`} value={row.title}
                    onChange={(e) => update(row.id, "title", e.target.value)} className={`${inputClass} w-full`} />
                </td>
                <td className="w-16 px-2 py-1.5">
                  <input aria-label={`Min players for ${row.id}`} value={row.minPlayers} type="number"
                    onChange={(e) => update(row.id, "minPlayers", e.target.value)} className={`${inputClass} w-full`} />
                </td>
                <td className="w-16 px-2 py-1.5">
                  <input aria-label={`Max players for ${row.id}`} value={row.maxPlayers} type="number"
                    onChange={(e) => update(row.id, "maxPlayers", e.target.value)} className={`${inputClass} w-full`} />
                </td>
                <td className="w-20 px-2 py-1.5">
                  <input aria-label={`Age rating for ${row.id}`} value={row.ageRating}
                    onChange={(e) => update(row.id, "ageRating", e.target.value)} className={`${inputClass} w-full`} />
                </td>
                <td className="w-24 px-2 py-1.5">
                  <input aria-label={`Genre for ${row.id}`} value={row.genre}
                    onChange={(e) => update(row.id, "genre", e.target.value)} className={`${inputClass} w-full`} />
                </td>
                <td className="w-64 px-2 py-1.5">
                  <textarea aria-label={`Description for ${row.id}`} value={row.description} rows={2}
                    onChange={(e) => update(row.id, "description", e.target.value)} className={`${inputClass} w-full resize-y`} />
                </td>
                <td className="px-2 py-1.5">
                  <input aria-label={`Cover URL for ${row.id}`} value={row.coverUrl}
                    onChange={(e) => update(row.id, "coverUrl", e.target.value)} className={`${inputClass} w-full`} />
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
          <span className="text-sm text-ink-muted">Saved {state.updated} game{state.updated === 1 ? "" : "s"}.</span>
        )}
        {state && "error" in state && (
          <span className="text-sm text-red-600 dark:text-red-400">{state.error}</span>
        )}
      </div>
    </form>
  )
}
