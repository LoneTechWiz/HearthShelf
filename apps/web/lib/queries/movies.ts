import { db } from "@/lib/db"
import { movies, lendableItems, checkouts } from "@/lib/db/schema"
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm"

export type MovieRow = typeof movies.$inferSelect
export type MovieWithAvailability = MovieRow & {
  isCheckedOut: boolean
  lendableItemId: string | null
}

export async function getMoviesForUser(userId: string): Promise<MovieWithAvailability[]> {
  const rows = await db
    .select({
      id: movies.id,
      userId: movies.userId,
      title: movies.title,
      director: movies.director,
      year: movies.year,
      posterUrl: movies.posterUrl,
      format: movies.format,
      genre: movies.genre,
      runtime: movies.runtime,
      description: movies.description,
      createdAt: movies.createdAt,
      lendableItemId: lendableItems.id,
      activeCheckoutId: checkouts.id,
    })
    .from(movies)
    .leftJoin(
      lendableItems,
      and(eq(lendableItems.type, "movie"), eq(lendableItems.refId, movies.id))
    )
    .leftJoin(
      checkouts,
      and(eq(checkouts.lendableItemId, lendableItems.id), isNull(checkouts.returnedAt))
    )
    .where(eq(movies.userId, userId))
    .orderBy(desc(movies.createdAt))

  return rows.map(({ activeCheckoutId, ...movie }) => ({
    ...movie,
    isCheckedOut: activeCheckoutId !== null,
  }))
}

export async function getMovieById(
  id: string,
  userId: string
): Promise<MovieWithAvailability | null> {
  const rows = await db
    .select({
      id: movies.id,
      userId: movies.userId,
      title: movies.title,
      director: movies.director,
      year: movies.year,
      posterUrl: movies.posterUrl,
      format: movies.format,
      genre: movies.genre,
      runtime: movies.runtime,
      description: movies.description,
      createdAt: movies.createdAt,
      lendableItemId: lendableItems.id,
      activeCheckoutId: checkouts.id,
    })
    .from(movies)
    .leftJoin(
      lendableItems,
      and(eq(lendableItems.type, "movie"), eq(lendableItems.refId, movies.id))
    )
    .leftJoin(
      checkouts,
      and(eq(checkouts.lendableItemId, lendableItems.id), isNull(checkouts.returnedAt))
    )
    .where(and(eq(movies.id, id), eq(movies.userId, userId)))
    .limit(1)

  if (!rows[0]) return null
  const { activeCheckoutId, ...movie } = rows[0]
  return { ...movie, isCheckedOut: activeCheckoutId !== null }
}

type MovieData = {
  title: string
  director: string | null
  year: number | null
  posterUrl: string | null
  format: string | null
  genre: string | null
  runtime: number | null
  description: string | null
}

export async function createMovieRecord(userId: string, data: MovieData): Promise<void> {
  await db.transaction(async (tx) => {
    const [movie] = await tx
      .insert(movies)
      .values({ userId, ...data })
      .returning({ id: movies.id })
    await tx.insert(lendableItems).values({ userId, type: "movie", refId: movie.id })
  })
}

export async function createMovieRecordReturningId(
  userId: string,
  data: MovieData
): Promise<string> {
  let movieId = ""
  await db.transaction(async (tx) => {
    const [movie] = await tx
      .insert(movies)
      .values({ userId, ...data })
      .returning({ id: movies.id })
    movieId = movie.id
    await tx.insert(lendableItems).values({ userId, type: "movie", refId: movie.id })
  })
  return movieId
}

export async function updateMovieRecord(
  id: string,
  userId: string,
  data: MovieData
): Promise<void> {
  await db
    .update(movies)
    .set(data)
    .where(and(eq(movies.id, id), eq(movies.userId, userId)))
}

export async function deleteMovieRecord(id: string, userId: string): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .delete(lendableItems)
      .where(
        and(
          eq(lendableItems.type, "movie"),
          eq(lendableItems.refId, id),
          eq(lendableItems.userId, userId)
        )
      )
    await tx.delete(movies).where(and(eq(movies.id, id), eq(movies.userId, userId)))
  })
}

export async function findMovieMatch(
  userId: string,
  row: { title: string }
): Promise<MovieRow | null> {
  const rows = await db
    .select()
    .from(movies)
    .where(
      and(eq(movies.userId, userId), sql`lower(${movies.title}) = lower(${row.title})`)
    )
    .limit(1)
  return rows[0] ?? null
}

export async function getMoviesByIds(userId: string, ids: string[]): Promise<MovieRow[]> {
  if (ids.length === 0) return []
  return db
    .select()
    .from(movies)
    .where(and(eq(movies.userId, userId), inArray(movies.id, ids)))
    .orderBy(desc(movies.createdAt))
}
