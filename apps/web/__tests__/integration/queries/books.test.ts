import { describe, it, expect, beforeEach } from "vitest"
import {
  createBookRecord,
  getBooksForUser,
  deleteBookRecord,
} from "@/lib/queries/books"
import { lendableItems, users } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
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
    expect(books[0].lendableItemId).not.toBeNull()
  })

  it("creates a lendableItem row alongside the book", async () => {
    await createBookRecord(USER_ID, { title: "Dune", authors: null, isbn: null, description: null, coverUrl: null })
    const [book] = await getBooksForUser(USER_ID)
    const rows = await db
      .select()
      .from(lendableItems)
      .where(and(eq(lendableItems.type, "book"), eq(lendableItems.refId, book.id)))
    expect(rows).toHaveLength(1)
    expect(rows[0].userId).toBe(USER_ID)
  })

  it("deletes a book and its lendableItem", async () => {
    await createBookRecord(USER_ID, { title: "Temp", authors: null, isbn: null, description: null, coverUrl: null })
    const [created] = await getBooksForUser(USER_ID)
    await deleteBookRecord(created.id, USER_ID)
    expect(await getBooksForUser(USER_ID)).toHaveLength(0)
    const remaining = await db
      .select()
      .from(lendableItems)
      .where(eq(lendableItems.refId, created.id))
    expect(remaining).toHaveLength(0)
  })

  it("does not return another user's books", async () => {
    await db.insert(users).values({ id: "other", email: "other@example.com" })
    await createBookRecord("other", { title: "Hidden", authors: null, isbn: null, description: null, coverUrl: null })
    expect(await getBooksForUser(USER_ID)).toHaveLength(0)
  })
})
