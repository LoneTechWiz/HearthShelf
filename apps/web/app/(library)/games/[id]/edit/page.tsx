import Link from "next/link"
import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { getGameById } from "@/lib/queries/games"
import { updateGame } from "@/lib/actions/games"
import { GameForm } from "@/components/games/game-form"

export default async function EditGamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const game = await getGameById(id, session!.user!.id!)
  if (!game) notFound()

  return (
    <div>
      <div className="mb-6">
        <Link href={`/games/${id}`} className="text-sm text-ink-muted hover:text-ink">← Back to game</Link>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Edit Game</h1>
      </div>
      <GameForm action={updateGame} defaultValues={game} submitLabel="Save Changes" />
    </div>
  )
}
