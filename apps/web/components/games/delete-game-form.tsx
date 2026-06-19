"use client"

import { deleteGame } from "@/lib/actions/games"
import { btnDanger } from "@/components/ui/classes"

export function DeleteGameForm({ gameId }: { gameId: string }) {
  const handleDelete = async (formData: FormData) => {
    if (!confirm("Delete this game? This cannot be undone.")) return
    await deleteGame(null, formData)
  }
  return (
    <form action={handleDelete}>
      <input type="hidden" name="id" value={gameId} />
      <button type="submit" className={btnDanger}>Delete</button>
    </form>
  )
}
