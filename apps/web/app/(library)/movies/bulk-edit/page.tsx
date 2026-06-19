import Link from "next/link"
import { auth } from "@/auth"
import { getMoviesForUser, getMoviesByIds } from "@/lib/queries/movies"
import { MovieBulkEdit } from "@/components/movies/movie-bulk-edit"

export default async function BulkEditMoviesPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>
}) {
  const session = await auth()
  const userId = session!.user!.id!
  const { ids } = await searchParams
  const idList = ids ? ids.split(",").filter(Boolean) : null
  const movies = idList
    ? await getMoviesByIds(userId, idList)
    : await getMoviesForUser(userId)

  return (
    <div>
      <div className="mb-6">
        <Link href="/movies" className="text-sm text-ink-muted hover:text-ink">← Back to movies</Link>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">
          {idList ? "Review imported movies" : "Bulk edit"}
        </h1>
      </div>
      <MovieBulkEdit key={ids ?? "all"} movies={movies} />
    </div>
  )
}
