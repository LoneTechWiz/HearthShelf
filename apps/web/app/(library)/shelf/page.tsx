import { auth } from "@/auth"
import { getBooksForUser } from "@/lib/queries/books"
import { getMoviesForUser } from "@/lib/queries/movies"
import { getGamesForUser } from "@/lib/queries/games"
import { ShelfView } from "@/components/shelf/shelf-view"

type ShelfType = "books" | "movies" | "games"

function getInitialShelf(type: string | undefined): ShelfType {
  return type === "movies" || type === "games" ? type : "books"
}

export default async function ShelfPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const { type } = await searchParams
  const session = await auth()
  const userId = session!.user!.id!
  const [books, movies, games] = await Promise.all([
    getBooksForUser(userId),
    getMoviesForUser(userId),
    getGamesForUser(userId),
  ])

  const initialShelf = getInitialShelf(type)

  return (
    <ShelfView
      key={initialShelf}
      books={books}
      movies={movies}
      games={games}
      initialShelf={initialShelf}
    />
  )
}
