import { describe, it, expect, beforeEach } from "vitest"
import {
  createBookRecord,
  getBooksForUser,
  deleteBookRecord,
} from "@/lib/queries/books"
import { users } from "@/lib/db/schema"
import { db, truncateAll } from "../helpers"

const USER_ID = "itest-user"

beforeEach(async () => {
  await truncateAll()
  await db.insert(users).values({ id: USER_ID, email: "itest@example.com" })
})

describe("books queries", () => {
  it("creates a book and reads it back for the user", async () => {
    await createBookRecord(USER_ID, {
      title: "Dune",
      authors: "Frank Herbert",
      isbn: "9780441013593",
      description: null,
      coverUrl: null,
    })
    const books = await getBooksForUser(USER_ID)
    expect(books).toHaveLength(1)
    expect(books[0]).toMatchObject({
      title: "Dune",
      authors: "Frank Herbert",
      isbn: "9780441013593",
      isCheckedOut: false,
    })
  })

  it("deletes a book by id and user", async () => {
    await createBookRecord(USER_ID, {
      title: "Temp",
      authors: null,
      isbn: null,
      description: null,
      coverUrl: null,
    })
    const [created] = await getBooksForUser(USER_ID)
    await deleteBookRecord(created.id, USER_ID)
    expect(await getBooksForUser(USER_ID)).toHaveLength(0)
  })

  it("does not return another user's books", async () => {
    await db.insert(users).values({ id: "other", email: "other@example.com" })
    await createBookRecord("other", {
      title: "Hidden",
      authors: null,
      isbn: null,
      description: null,
      coverUrl: null,
    })
    expect(await getBooksForUser(USER_ID)).toHaveLength(0)
  })
})
