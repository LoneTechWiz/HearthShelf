import { auth } from "@/auth"
import { getBooksForUser } from "@/lib/queries/books"
import { getMoviesForUser } from "@/lib/queries/movies"
import { getGamesForUser } from "@/lib/queries/games"
import { ShelfView } from "@/components/shelf/shelf-view"

export default async function ShelfPage() {
  const session = await auth()
  const userId = session!.user!.id!
  const [books, movies, games] = await Promise.all([
    getBooksForUser(userId),
    getMoviesForUser(userId),
    getGamesForUser(userId),
  ])

  return <ShelfView books={books} movies={movies} games={games} />
}
