import Link from "next/link"
import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { getMovieById } from "@/lib/queries/movies"
import { updateMovie } from "@/lib/actions/movies"
import { MovieForm } from "@/components/movies/movie-form"

export default async function EditMoviePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const movie = await getMovieById(id, session!.user!.id!)
  if (!movie) notFound()

  return (
    <div>
      <div className="mb-6">
        <Link href={`/movies/${id}`} className="text-sm text-ink-muted hover:text-ink">← Back to movie</Link>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Edit Movie</h1>
      </div>
      <MovieForm action={updateMovie} defaultValues={movie} submitLabel="Save Changes" />
    </div>
  )
}
