import Link from "next/link"
import { auth } from "@/auth"
import { getMoviesForUser } from "@/lib/queries/movies"
import { MoviesList } from "@/components/movies/movies-list"
import { PageHeader } from "@/components/ui/page-header"
import { btnPrimary, btnSecondary } from "@/components/ui/classes"

export default async function MoviesPage() {
  const session = await auth()
  const movies = await getMoviesForUser(session!.user!.id!)
  return (
    <div>
      <PageHeader
        title="My Movies"
        subtitle={`${movies.length} ${movies.length === 1 ? "movie" : "movies"}`}
        actions={
          <>
            <Link href="/movies/bulk-edit" className={btnSecondary}>Bulk edit</Link>
            <Link href="/movies/import" className={btnSecondary}>Import CSV</Link>
            <Link href="/movies/new" className={btnPrimary}>Add Movie</Link>
          </>
        }
      />
      <MoviesList movies={movies} />
    </div>
  )
}
