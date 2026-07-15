import {
  buildBookAuthorCollections,
  buildBookSeriesCollections,
  buildGameCategoryCollections,
  buildGamePlayerCollections,
  buildMovieGenreCollections,
  buildMovieSeriesCollections,
} from "@/lib/shelf-collections"
import type { ItemType, MobileCollection } from "@my-shelf/types"
import { getBooksForUser } from "@/lib/queries/books"
import { getGamesForUser } from "@/lib/queries/games"
import { getMoviesForUser } from "@/lib/queries/movies"
import { requireMobileUser } from "@/app/api/mobile/_utils"

function toMobileCollections(
  collections: Array<{
    name: string
    ownedCount: number
    totalCount?: number | null
    items: Array<{
      identity: string
      title: string
      subtitle: string | null
      imageUrl: string | null
      href: string
      position: number | null
      copyCount: number
    }>
  }>,
  type: ItemType
): MobileCollection[] {
  return collections.map((collection) => ({
    ...collection,
    items: collection.items.map(({ href, ...item }) => ({
      ...item,
      id: href.split("/").at(-1) ?? "",
      type,
    })),
  }))
}

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

  const authors = buildBookAuthorCollections(books)
  const series = buildBookSeriesCollections(books)
  const movieSeries = buildMovieSeriesCollections(movies)
  const movieGenres = buildMovieGenreCollections(movies)
  const gameCategories = buildGameCategoryCollections(games)
  const gamePlayers = buildGamePlayerCollections(games)

  return Response.json({
    books: {
      authors: toMobileCollections(authors, "book"),
      series: toMobileCollections(series, "book"),
    },
    movies: {
      series: toMobileCollections(movieSeries, "movie"),
      genres: toMobileCollections(movieGenres, "movie"),
    },
    games: {
      categories: toMobileCollections(gameCategories, "game"),
      players: toMobileCollections(gamePlayers, "game"),
    },
    authors: summarize(authors),
    series: summarize(series),
    movieSeries: summarize(movieSeries),
    gameGenres: summarize(gameCategories),
  })
}
