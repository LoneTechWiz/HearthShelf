import Link from "next/link"
import { auth } from "@/auth"
import { getGamesForUser, getGamesByIds } from "@/lib/queries/games"
import { GameBulkEdit } from "@/components/games/game-bulk-edit"

export default async function BulkEditGamesPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>
}) {
  const session = await auth()
  const userId = session!.user!.id!
  const { ids } = await searchParams
  const idList = ids ? ids.split(",").filter(Boolean) : null
  const games = idList
    ? await getGamesByIds(userId, idList)
    : await getGamesForUser(userId)

  return (
    <div>
      <div className="mb-6">
        <Link href="/games" className="text-sm text-ink-muted hover:text-ink">← Back to games</Link>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">
          {idList ? "Review imported games" : "Bulk edit"}
        </h1>
      </div>
      <GameBulkEdit key={ids ?? "all"} games={games} />
    </div>
  )
}
