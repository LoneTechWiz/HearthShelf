import { describe, it, expect, beforeEach } from "vitest"
import {
  createMovieRecord,
  createMovieRecordReturningId,
  getMoviesForUser,
  getMovieById,
  updateMovieRecord,
  deleteMovieRecord,
} from "@/lib/queries/movies"
import { lendableItems, users } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { db, truncateAll } from "../helpers"

const USER_ID = "itest-user"

const movieData = (title: string) => ({
  title,
  director: null,
  year: null,
  posterUrl: null,
  format: null,
  genre: null,
  runtime: null,
  description: null,
})

beforeEach(async () => {
  await truncateAll()
  await db.insert(users).values({ id: USER_ID, email: "itest@example.com" })
})

describe("movie queries", () => {
  it("creates a movie and reads it back", async () => {
    await createMovieRecord(USER_ID, { ...movieData("Inception"), director: "Christopher Nolan", year: 2010 })
    const movies = await getMoviesForUser(USER_ID)
    expect(movies).toHaveLength(1)
    expect(movies[0]).toMatchObject({
      title: "Inception",
      director: "Christopher Nolan",
      year: 2010,
      isCheckedOut: false,
    })
    expect(movies[0].lendableItemId).not.toBeNull()
  })

  it("creates a lendableItem row alongside the movie", async () => {
    const id = await createMovieRecordReturningId(USER_ID, movieData("Arrival"))
    const rows = await db
      .select()
      .from(lendableItems)
      .where(and(eq(lendableItems.type, "movie"), eq(lendableItems.refId, id)))
    expect(rows).toHaveLength(1)
  })

  it("returns a movie by id scoped to user", async () => {
    const id = await createMovieRecordReturningId(USER_ID, movieData("Dune"))
    const movie = await getMovieById(id, USER_ID)
    expect(movie).not.toBeNull()
    expect(movie?.title).toBe("Dune")
  })

  it("returns null for another user's movie", async () => {
    await db.insert(users).values({ id: "other", email: "other@example.com" })
    const id = await createMovieRecordReturningId("other", movieData("Hidden"))
    expect(await getMovieById(id, USER_ID)).toBeNull()
  })

  it("updates a movie", async () => {
    const id = await createMovieRecordReturningId(USER_ID, movieData("Dune"))
    await updateMovieRecord(id, USER_ID, { ...movieData("Dune: Part Two"), year: 2024 })
    const movie = await getMovieById(id, USER_ID)
    expect(movie?.title).toBe("Dune: Part Two")
    expect(movie?.year).toBe(2024)
  })

  it("deletes a movie and its lendableItem", async () => {
    const id = await createMovieRecordReturningId(USER_ID, movieData("Temp"))
    await deleteMovieRecord(id, USER_ID)
    expect(await getMovieById(id, USER_ID)).toBeNull()
    const remaining = await db
      .select()
      .from(lendableItems)
      .where(eq(lendableItems.refId, id))
    expect(remaining).toHaveLength(0)
  })

  it("does not return another user's movies", async () => {
    await db.insert(users).values({ id: "other", email: "other@example.com" })
    await createMovieRecord("other", movieData("Hidden"))
    expect(await getMoviesForUser(USER_ID)).toHaveLength(0)
  })
})
