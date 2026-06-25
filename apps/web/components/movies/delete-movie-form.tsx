"use client"

import { deleteMovie } from "@/lib/actions/movies"
import { btnDanger } from "@/components/ui/classes"

export function DeleteMovieForm({ movieId }: { movieId: string }) {
  const handleDelete = async (formData: FormData) => {
    if (!confirm("Delete this movie? This cannot be undone.")) return
    await deleteMovie(null, formData)
  }
  return (
    <form action={handleDelete}>
      <input type="hidden" name="id" value={movieId} />
      <button type="submit" className={btnDanger}>Delete</button>
    </form>
  )
}
