import Link from "next/link"
import { MovieForm } from "@/components/movies/movie-form"
import { createMovie } from "@/lib/actions/movies"

export default function NewMoviePage() {
  return (
    <div>
      <div className="mb-6">
        <Link href="/movies" className="text-sm text-ink-muted hover:text-ink">← Back to movies</Link>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Add a Movie</h1>
      </div>
      <MovieForm action={createMovie} submitLabel="Add Movie" />
    </div>
  )
}
