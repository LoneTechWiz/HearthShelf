import { describe, it, expect, beforeEach } from "vitest"
import {
  createBookRecord,
  createBookRecordReturningId,
  findBookMatch,
  getBooksByIds,
} from "@/lib/queries/books"
import { users } from "@/lib/db/schema"
import { db, truncateAll } from "../helpers"

const USER_ID = "itest-user"

beforeEach(async () => {
  await truncateAll()
  await db.insert(users).values({ id: USER_ID, email: "itest@example.com" })
})

describe("findBookMatch", () => {
  it("matches an existing book by ISBN", async () => {
    await createBookRecord(USER_ID, {
      title: "Dune",
      authors: "Frank Herbert",
      isbn: "9780441013593",
      description: null,
      coverUrl: null,
    })
    const match = await findBookMatch(USER_ID, {
      title: "Different Title",
      authors: null,
      isbn: "9780441013593",
    })
    expect(match?.title).toBe("Dune")
  })

  it("falls back to case-insensitive title + authors when isbn is null", async () => {
    await createBookRecord(USER_ID, {
      title: "Dune",
      authors: "Frank Herbert",
      isbn: null,
      description: null,
      coverUrl: null,
    })
    const match = await findBookMatch(USER_ID, {
      title: "dune",
      authors: "frank herbert",
      isbn: null,
    })
    expect(match?.title).toBe("Dune")
  })

  it("returns null when nothing matches", async () => {
    const match = await findBookMatch(USER_ID, {
      title: "Nope",
      authors: null,
      isbn: null,
    })
    expect(match).toBeNull()
  })

  it("does not match another user's book", async () => {
    await db.insert(users).values({ id: "other", email: "other@example.com" })
    await createBookRecord("other", {
      title: "Dune",
      authors: null,
      isbn: "9780441013593",
      description: null,
      coverUrl: null,
    })
    const match = await findBookMatch(USER_ID, {
      title: "Dune",
      authors: null,
      isbn: "9780441013593",
    })
    expect(match).toBeNull()
  })
})

describe("createBookRecordReturningId + getBooksByIds", () => {
  it("returns the new id and reads it back", async () => {
    const id = await createBookRecordReturningId(USER_ID, {
      title: "Dune",
      authors: null,
      isbn: null,
      description: null,
      coverUrl: null,
    })
    expect(id).toBeTypeOf("string")
    const books = await getBooksByIds(USER_ID, [id])
    expect(books).toHaveLength(1)
    expect(books[0].title).toBe("Dune")
  })

  it("returns an empty array when given no ids", async () => {
    expect(await getBooksByIds(USER_ID, [])).toEqual([])
  })
})
