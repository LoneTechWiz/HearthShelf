import Link from "next/link"
import { GameForm } from "@/components/games/game-form"
import { createGame } from "@/lib/actions/games"

export default function NewGamePage() {
  return (
    <div>
      <div className="mb-6">
        <Link href="/games" className="text-sm text-ink-muted hover:text-ink">← Back to games</Link>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Add a Game</h1>
      </div>
      <GameForm action={createGame} submitLabel="Add Game" />
    </div>
  )
}
