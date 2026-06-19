import Link from "next/link"
import { auth } from "@/auth"
import { getGamesForUser } from "@/lib/queries/games"
import { GamesList } from "@/components/games/games-list"
import { PageHeader } from "@/components/ui/page-header"
import { btnPrimary, btnSecondary } from "@/components/ui/classes"

export default async function GamesPage() {
  const session = await auth()
  const games = await getGamesForUser(session!.user!.id!)
  return (
    <div>
      <PageHeader
        title="My Games"
        subtitle={`${games.length} ${games.length === 1 ? "game" : "games"}`}
        actions={
          <>
            <Link href="/games/bulk-edit" className={btnSecondary}>Bulk edit</Link>
            <Link href="/games/import" className={btnSecondary}>Import CSV</Link>
            <Link href="/games/new" className={btnPrimary}>Add Game</Link>
          </>
        }
      />
      <GamesList games={games} />
    </div>
  )
}
