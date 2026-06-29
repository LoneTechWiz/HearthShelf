import Link from "next/link"
import { auth } from "@/auth"
import { getBooksForUser } from "@/lib/queries/books"
import { getMoviesForUser } from "@/lib/queries/movies"
import { getGamesForUser } from "@/lib/queries/games"
import {
  buildBookAuthorCollections,
  buildBookSeriesCollections,
  buildMovieDirectorCollections,
  buildMovieGenreCollections,
  buildGameCategoryCollections,
  buildGamePlayerCollections,
} from "@/lib/shelf-collections"
import { ShelfCollections } from "@/components/collections/shelf-collections"
import { PageHeader } from "@/components/ui/page-header"
import { btnSecondary } from "@/components/ui/classes"

export default async function CollectionsPage() {
  const session = await auth()
  const userId = session!.user!.id!
  const [books, movies, games] = await Promise.all([
    getBooksForUser(userId),
    getMoviesForUser(userId),
    getGamesForUser(userId),
  ])

  return (
    <div>
      <PageHeader
        title="Collections"
        subtitle="Browse grouped views across books, movies, and games."
        actions={
          <>
            <Link href="/books/bulk-edit" className={btnSecondary}>Edit Books</Link>
            <Link href="/movies/bulk-edit" className={btnSecondary}>Edit Movies</Link>
            <Link href="/games/bulk-edit" className={btnSecondary}>Edit Games</Link>
          </>
        }
      />
      <ShelfCollections
        data={{
          books: {
            authors: buildBookAuthorCollections(books),
            series: buildBookSeriesCollections(books),
          },
          movies: {
            directors: buildMovieDirectorCollections(movies),
            genres: buildMovieGenreCollections(movies),
          },
          games: {
            categories: buildGameCategoryCollections(games),
            players: buildGamePlayerCollections(games),
          },
        }}
      />
    </div>
  )
}
