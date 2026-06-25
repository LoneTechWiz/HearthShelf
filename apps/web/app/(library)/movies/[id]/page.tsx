import Link from "next/link"
import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { getMovieById } from "@/lib/queries/movies"
import { DeleteMovieForm } from "@/components/movies/delete-movie-form"
import { StatusBadge } from "@/components/ui/status-badge"
import { btnPrimary, btnSecondary } from "@/components/ui/classes"

export default async function MovieDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const movie = await getMovieById(id, session!.user!.id!)
  if (!movie) notFound()

  return (
    <div>
      <div className="mb-6">
        <Link href="/movies" className="text-sm text-ink-muted hover:text-ink">← Back to movies</Link>
      </div>
      <div className="rounded-xl border border-edge bg-surface p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">{movie.title}</h1>
            {movie.director && <p className="mt-1 text-ink-muted">{movie.director}</p>}
            <div className="mt-1 flex flex-wrap gap-2 text-xs text-ink-faint">
              {movie.year && <span>{movie.year}</span>}
              {movie.format && <span>· {movie.format}</span>}
              {movie.genre && <span>· {movie.genre}</span>}
              {movie.runtime && <span>· {movie.runtime} min</span>}
            </div>
            <div className="mt-2">
              <StatusBadge status={movie.isCheckedOut ? "checked-out" : "available"} />
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {!movie.isCheckedOut && movie.lendableItemId && (
              <Link href={`/checkouts/new?lendableItemId=${movie.lendableItemId}`} className={btnPrimary}>
                Check Out
              </Link>
            )}
            <Link href={`/movies/${movie.id}/edit`} className={btnSecondary}>Edit</Link>
            <DeleteMovieForm movieId={movie.id} />
          </div>
        </div>
        {movie.description && (
          <p className="text-sm leading-relaxed text-ink-muted">{movie.description}</p>
        )}
        {movie.posterUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={movie.posterUrl} alt={`Poster for ${movie.title}`}
            className="mt-4 h-48 w-auto rounded-lg object-cover border border-edge" />
        )}
      </div>
    </div>
  )
}
