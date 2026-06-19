import { describe, it, expect, beforeEach } from "vitest"
import {
  createCheckoutRecord,
  getActiveCheckouts,
  getCheckoutHistory,
  returnItemRecord,
} from "@/lib/queries/checkouts"
import { createBookRecordReturningId, getBooksForUser } from "@/lib/queries/books"
import { createMovieRecordReturningId, getMoviesForUser } from "@/lib/queries/movies"
import { createGameRecordReturningId, getGamesForUser } from "@/lib/queries/games"
import { createContactRecord, getContactsForUser } from "@/lib/queries/contacts"
import { users } from "@/lib/db/schema"
import { db, truncateAll } from "../helpers"

const USER_ID = "itest-user"

beforeEach(async () => {
  await truncateAll()
  await db.insert(users).values({ id: USER_ID, email: "itest@example.com" })
})

async function bookLendableItemId(title: string): Promise<string> {
  await createBookRecordReturningId(USER_ID, { title, authors: null, isbn: null, description: null, coverUrl: null })
  const books = await getBooksForUser(USER_ID)
  return books.find((b) => b.title === title)!.lendableItemId!
}

async function movieLendableItemId(title: string): Promise<string> {
  await createMovieRecordReturningId(USER_ID, { title, director: null, year: null, posterUrl: null, format: null, genre: null, runtime: null, description: null })
  const movies = await getMoviesForUser(USER_ID)
  return movies.find((m) => m.title === title)!.lendableItemId!
}

async function gameLendableItemId(title: string): Promise<string> {
  await createGameRecordReturningId(USER_ID, { title, coverUrl: null, minPlayers: null, maxPlayers: null, ageRating: null, genre: null, description: null })
  const games = await getGamesForUser(USER_ID)
  return games.find((g) => g.title === title)!.lendableItemId!
}

describe("checkout queries", () => {
  it("checks out a book and shows it as active", async () => {
    const li = await bookLendableItemId("Dune")
    await createCheckoutRecord(USER_ID, { lendableItemId: li, contactId: null, dueDate: null, notes: null })

    const active = await getActiveCheckouts(USER_ID)
    expect(active).toHaveLength(1)
    expect(active[0].item).toMatchObject({ type: "book", title: "Dune" })
    expect(active[0].contact).toBeNull()

    const books = await getBooksForUser(USER_ID)
    expect(books[0].isCheckedOut).toBe(true)
  })

  it("checks out a movie and shows it as active", async () => {
    const li = await movieLendableItemId("Inception")
    await createCheckoutRecord(USER_ID, { lendableItemId: li, contactId: null, dueDate: null, notes: null })

    const active = await getActiveCheckouts(USER_ID)
    expect(active).toHaveLength(1)
    expect(active[0].item).toMatchObject({ type: "movie", title: "Inception" })
  })

  it("checks out a game and shows it as active", async () => {
    const li = await gameLendableItemId("Catan")
    await createCheckoutRecord(USER_ID, { lendableItemId: li, contactId: null, dueDate: null, notes: null })

    const active = await getActiveCheckouts(USER_ID)
    expect(active).toHaveLength(1)
    expect(active[0].item).toMatchObject({ type: "game", title: "Catan" })
  })

  it("returns an item and moves it to history", async () => {
    const li = await bookLendableItemId("Dune")
    await createCheckoutRecord(USER_ID, { lendableItemId: li, contactId: null, dueDate: null, notes: null })
    const [active] = await getActiveCheckouts(USER_ID)
    await returnItemRecord(active.id, USER_ID)

    expect(await getActiveCheckouts(USER_ID)).toHaveLength(0)
    const history = await getCheckoutHistory(USER_ID)
    expect(history).toHaveLength(1)
    expect(history[0].item).toMatchObject({ type: "book", title: "Dune" })
    expect(history[0].returnedAt).toBeInstanceOf(Date)
  })

  it("shows contact name on checkout", async () => {
    const li = await bookLendableItemId("Dune")
    await createContactRecord(USER_ID, { name: "Ada", email: null, phone: null })
    const [contact] = await getContactsForUser(USER_ID)
    await createCheckoutRecord(USER_ID, { lendableItemId: li, contactId: contact.id, dueDate: null, notes: null })

    const [active] = await getActiveCheckouts(USER_ID)
    expect(active.contact).toEqual({ id: contact.id, name: "Ada" })
  })

  it("does not show another user's checkouts", async () => {
    await db.insert(users).values({ id: "other", email: "other@example.com" })
    const li = await bookLendableItemId("Dune")
    await createCheckoutRecord(USER_ID, { lendableItemId: li, contactId: null, dueDate: null, notes: null })
    expect(await getActiveCheckouts("other")).toHaveLength(0)
  })
})
