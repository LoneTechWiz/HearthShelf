import Link from "next/link"
import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { getGameById } from "@/lib/queries/games"
import { DeleteGameForm } from "@/components/games/delete-game-form"
import { StatusBadge } from "@/components/ui/status-badge"
import { btnPrimary, btnSecondary } from "@/components/ui/classes"

export default async function GameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const game = await getGameById(id, session!.user!.id!)
  if (!game) notFound()

  const players = game.minPlayers === game.maxPlayers
    ? `${game.minPlayers} players`
    : game.minPlayers && game.maxPlayers
    ? `${game.minPlayers}–${game.maxPlayers} players`
    : null

  return (
    <div>
      <div className="mb-6">
        <Link href="/games" className="text-sm text-ink-muted hover:text-ink">← Back to games</Link>
      </div>
      <div className="rounded-xl border border-edge bg-surface p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">{game.title}</h1>
            <div className="mt-1 flex flex-wrap gap-2 text-xs text-ink-faint">
              {players && <span>{players}</span>}
              {game.ageRating && <span>· Ages {game.ageRating}</span>}
              {game.genre && <span>· {game.genre}</span>}
            </div>
            <div className="mt-2">
              <StatusBadge status={game.isCheckedOut ? "checked-out" : "available"} />
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {!game.isCheckedOut && game.lendableItemId && (
              <Link href={`/checkouts/new?lendableItemId=${game.lendableItemId}`} className={btnPrimary}>
                Check Out
              </Link>
            )}
            <Link href={`/games/${game.id}/edit`} className={btnSecondary}>Edit</Link>
            <DeleteGameForm gameId={game.id} />
          </div>
        </div>
        {game.description && (
          <p className="text-sm leading-relaxed text-ink-muted">{game.description}</p>
        )}
        {game.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={game.coverUrl} alt={`Cover of ${game.title}`}
            className="mt-4 h-48 w-auto rounded-lg object-cover border border-edge" />
        )}
      </div>
    </div>
  )
}
