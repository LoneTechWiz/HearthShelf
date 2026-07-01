import type { ItemType } from "@my-shelf/types"
import { deleteBookRecord, getBookById, updateBookRecord } from "@/lib/queries/books"
import { deleteGameRecord, getGameById, updateGameRecord } from "@/lib/queries/games"
import { deleteMovieRecord, getMovieById, updateMovieRecord } from "@/lib/queries/movies"
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

type Params = { params: Promise<{ type: string; id: string }> }

function parseType(type: string): ItemType | null {
  return type === "book" || type === "movie" || type === "game" ? type : null
}

export async function GET(request: Request, { params }: Params) {
  const user = await requireMobileUser(request)
  if (user instanceof Response) return user

  const { type: rawType, id } = await params
  const type = parseType(rawType)
  if (!type) return jsonError("Unknown item type", 404)

  if (type === "book") {
    const book = await getBookById(id, user.id)
    return book ? Response.json({ item: { ...toMobileBook(book), type } }) : jsonError("Not found", 404)
  }

  if (type === "movie") {
    const movie = await getMovieById(id, user.id)
    return movie ? Response.json({ item: { ...toMobileMovie(movie), type } }) : jsonError("Not found", 404)
  }

  const game = await getGameById(id, user.id)
  return game ? Response.json({ item: { ...toMobileGame(game), type } }) : jsonError("Not found", 404)
}

export async function PUT(request: Request, { params }: Params) {
  const user = await requireMobileUser(request)
  if (user instanceof Response) return user

  const { type: rawType, id } = await params
  const type = parseType(rawType)
  if (!type) return jsonError("Unknown item type", 404)

  const body = await request.json()
  const title = nullIfEmpty(body.title)
  if (!title) return jsonError("Title is required")

  if (type === "book") {
    await updateBookRecord(id, user.id, {
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
    return Response.json({ ok: true })
  }

  if (type === "movie") {
    await updateMovieRecord(id, user.id, {
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
    return Response.json({ ok: true })
  }

  await updateGameRecord(id, user.id, {
    title,
    coverUrl: nullIfEmpty(body.coverUrl),
    minPlayers: nullableNumber(body.minPlayers),
    maxPlayers: nullableNumber(body.maxPlayers),
    ageRating: nullIfEmpty(body.ageRating),
    genre: nullIfEmpty(body.genre),
    description: nullIfEmpty(body.description),
  })
  return Response.json({ ok: true })
}

export async function DELETE(request: Request, { params }: Params) {
  const user = await requireMobileUser(request)
  if (user instanceof Response) return user

  const { type: rawType, id } = await params
  const type = parseType(rawType)
  if (!type) return jsonError("Unknown item type", 404)

  if (type === "book") await deleteBookRecord(id, user.id)
  if (type === "movie") await deleteMovieRecord(id, user.id)
  if (type === "game") await deleteGameRecord(id, user.id)

  return Response.json({ ok: true })
}
