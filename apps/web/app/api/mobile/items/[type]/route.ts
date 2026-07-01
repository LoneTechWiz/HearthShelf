import type { ItemType } from "@my-shelf/types"
import { createBookRecord, getBooksForUser } from "@/lib/queries/books"
import { createGameRecord, getGamesForUser } from "@/lib/queries/games"
import { createMovieRecord, getMoviesForUser } from "@/lib/queries/movies"
import {
  jsonError,
  nullableNumber,
  nullablePositiveInt,
  nullIfEmpty,
  requireMobileUser,
  toMobileBook,
  toMobileGame,
  toMobileMovie,
} from "@/app/api/mobile/_utils"

type Params = { params: Promise<{ type: string }> }

function parseType(type: string): ItemType | null {
  return type === "book" || type === "movie" || type === "game" ? type : null
}

export async function GET(request: Request, { params }: Params) {
  const user = await requireMobileUser(request)
  if (user instanceof Response) return user

  const type = parseType((await params).type)
  if (!type) return jsonError("Unknown item type", 404)

  if (type === "book") {
    const books = await getBooksForUser(user.id)
    return Response.json({ items: books.map((book) => ({ ...toMobileBook(book), type })) })
  }

  if (type === "movie") {
    const movies = await getMoviesForUser(user.id)
    return Response.json({ items: movies.map((movie) => ({ ...toMobileMovie(movie), type })) })
  }

  const games = await getGamesForUser(user.id)
  return Response.json({ items: games.map((game) => ({ ...toMobileGame(game), type })) })
}

export async function POST(request: Request, { params }: Params) {
  const user = await requireMobileUser(request)
  if (user instanceof Response) return user

  const type = parseType((await params).type)
  if (!type) return jsonError("Unknown item type", 404)

  const body = await request.json()
  const title = nullIfEmpty(body.title)
  if (!title) return jsonError("Title is required")

  if (type === "book") {
    await createBookRecord(user.id, {
      title,
      authors: nullIfEmpty(body.authors),
      isbn: nullIfEmpty(body.isbn),
      seriesKey: nullIfEmpty(body.seriesKey),
      seriesName: nullIfEmpty(body.seriesName),
      seriesPosition: nullablePositiveInt(body.seriesPosition),
      seriesTotal: nullablePositiveInt(body.seriesTotal),
      description: nullIfEmpty(body.description),
      coverUrl: nullIfEmpty(body.coverUrl),
      genre: nullIfEmpty(body.genre),
    })
    return Response.json({ ok: true }, { status: 201 })
  }

  if (type === "movie") {
    await createMovieRecord(user.id, {
      title,
      seriesName: nullIfEmpty(body.seriesName),
      director: nullIfEmpty(body.director),
      year: nullableNumber(body.year),
      posterUrl: nullIfEmpty(body.posterUrl),
      format: nullIfEmpty(body.format),
      genre: nullIfEmpty(body.genre),
      runtime: nullableNumber(body.runtime),
      description: nullIfEmpty(body.description),
    })
    return Response.json({ ok: true }, { status: 201 })
  }

  await createGameRecord(user.id, {
    title,
    coverUrl: nullIfEmpty(body.coverUrl),
    minPlayers: nullableNumber(body.minPlayers),
    maxPlayers: nullableNumber(body.maxPlayers),
    ageRating: nullIfEmpty(body.ageRating),
    genre: nullIfEmpty(body.genre),
    description: nullIfEmpty(body.description),
  })
  return Response.json({ ok: true }, { status: 201 })
}
