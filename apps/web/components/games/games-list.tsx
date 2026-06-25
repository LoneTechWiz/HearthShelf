"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import type { GameWithAvailability } from "@/lib/queries/games"
import { inputClass, btnPrimary, btnSecondarySm } from "@/components/ui/classes"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"

const gameIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.959.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
  </svg>
)

function playerCount(min: number | null, max: number | null): string | null {
  if (!min && !max) return null
  if (min === max) return `${min} players`
  if (!max) return `${min}+ players`
  if (!min) return `Up to ${max} players`
  return `${min}–${max} players`
}

export function GamesList({ games }: { games: GameWithAvailability[] }) {
  const [query, setQuery] = useState("")
  const [view, setView] = useState<"list" | "grid">("list")

  useEffect(() => {
    const id = setTimeout(() => {
      if (localStorage.getItem("games-view") === "grid") setView("grid")
    }, 0)
    return () => clearTimeout(id)
  }, [])

  function changeView(next: "list" | "grid") {
    setView(next)
    localStorage.setItem("games-view", next)
  }

  const filtered = query
    ? games.filter((g) => g.title.toLowerCase().includes(query.toLowerCase()))
    : games

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <input type="search" placeholder="Search games…" value={query}
          onChange={(e) => setQuery(e.target.value)} className={`w-full max-w-sm ${inputClass}`} />
        <div className="flex shrink-0 rounded-lg border border-edge bg-surface p-0.5" role="group" aria-label="View">
          {(["list", "grid"] as const).map((v) => (
            <button key={v} type="button" onClick={() => changeView(v)} aria-pressed={view === v}
              className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                view === v ? "bg-accent-soft text-accent" : "text-ink-muted hover:text-ink"
              }`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        query ? (
          <EmptyState icon={gameIcon} title="No matches" description={`Nothing matches "${query}".`} />
        ) : (
          <EmptyState icon={gameIcon} title="No games yet"
            description="Add your first game to start tracking your collection."
            action={<Link href="/games/new" className={btnPrimary}>Add Game</Link>} />
        )
      ) : view === "list" ? (
        <ul className="divide-y divide-edge rounded-xl border border-edge bg-surface shadow-sm">
          {filtered.map((game) => (
            <li key={game.id}>
              <div className="flex items-center justify-between px-5 py-4 hover:bg-surface-raised">
                <Link href={`/games/${game.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                  {game.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={game.coverUrl} alt="" className="h-14 w-10 flex-shrink-0 rounded object-cover border border-edge" />
                  ) : (
                    <div className="flex h-14 w-10 flex-shrink-0 items-center justify-center rounded border border-edge bg-surface-raised text-ink-faint [&>svg]:h-5 [&>svg]:w-5">
                      {gameIcon}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{game.title}</p>
                    {playerCount(game.minPlayers, game.maxPlayers) && (
                      <p className="truncate text-sm text-ink-muted">{playerCount(game.minPlayers, game.maxPlayers)}</p>
                    )}
                    {game.ageRating && (
                      <p className="truncate text-xs text-ink-faint">Ages {game.ageRating}</p>
                    )}
                  </div>
                </Link>
                <div className="ml-4 flex shrink-0 items-center gap-2">
                  <StatusBadge status={game.isCheckedOut ? "checked-out" : "available"} />
                  {!game.isCheckedOut && game.lendableItemId && (
                    <Link href={`/checkouts/new?lendableItemId=${game.lendableItemId}`} className={btnSecondarySm}>
                      Check Out
                    </Link>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
          {filtered.map((game) => (
            <li key={game.id}>
              <Link href={`/games/${game.id}`} className="group block">
                <div className="relative aspect-2/3 overflow-hidden rounded-lg border border-edge bg-surface-raised shadow-sm transition-transform group-hover:-translate-y-0.5">
                  {game.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={game.coverUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-center">
                      <span className="font-display text-sm font-semibold text-ink line-clamp-4">{game.title}</span>
                    </div>
                  )}
                  <span role="img" aria-label={game.isCheckedOut ? "Checked out" : "Available"}
                    className={`absolute right-2 top-2 h-2.5 w-2.5 rounded-full ring-2 ring-surface ${
                      game.isCheckedOut ? "bg-amber-500" : "bg-emerald-500"
                    }`} />
                </div>
                <p className="mt-2 truncate text-sm font-medium text-ink">{game.title}</p>
                {playerCount(game.minPlayers, game.maxPlayers) && (
                  <p className="truncate text-xs text-ink-muted">{playerCount(game.minPlayers, game.maxPlayers)}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-right text-xs text-ink-faint">
        Game data{" "}
        <a href="https://boardgamegeek.com" target="_blank" rel="noopener noreferrer" className="hover:text-ink-muted underline">
          Powered by BGG
        </a>
      </p>
    </>
  )
}
