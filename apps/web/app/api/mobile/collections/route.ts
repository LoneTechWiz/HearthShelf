import {
  buildBookAuthorCollections,
  buildBookSeriesCollections,
  buildGameCategoryCollections,
  buildMovieSeriesCollections,
} from "@/lib/shelf-collections"
import { getBooksForUser } from "@/lib/queries/books"
import { getGamesForUser } from "@/lib/queries/games"
import { getMoviesForUser } from "@/lib/queries/movies"
import { requireMobileUser } from "@/app/api/mobile/_utils"

function summarize(collections: Array<{ name: string; ownedCount: number }>) {
  return collections.map((collection) => ({
    key: collection.name.toLowerCase(),
    label: collection.name,
    count: collection.ownedCount,
  }))
}

export async function GET(request: Request) {
  const user = await requireMobileUser(request)
  if (user instanceof Response) return user

  const [books, movies, games] = await Promise.all([
    getBooksForUser(user.id),
    getMoviesForUser(user.id),
    getGamesForUser(user.id),
  ])

  return Response.json({
    authors: summarize(buildBookAuthorCollections(books)),
    series: summarize(buildBookSeriesCollections(books)),
    movieSeries: summarize(buildMovieSeriesCollections(movies)),
    gameGenres: summarize(buildGameCategoryCollections(games)),
  })
}
