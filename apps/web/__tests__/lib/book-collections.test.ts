import { describe, expect, it } from "vitest"
import { buildAuthorCollections, buildSeriesCollections, type CollectionBook } from "@/lib/book-collections"

const baseBook = {
  userId: "user-1",
  description: null,
  genre: null,
  createdAt: new Date("2026-01-01"),
}

function book(overrides: Partial<CollectionBook> & Pick<CollectionBook, "id" | "title">): CollectionBook {
  return {
    ...baseBook,
    authors: null,
    isbn: null,
    coverUrl: null,
    seriesName: null,
    seriesPosition: null,
    seriesTotal: null,
    ...overrides,
  }
}

describe("book collections", () => {
  it("does not count duplicate copies toward series completion", () => {
    const collections = buildSeriesCollections([
      book({
        id: "copy-1",
        title: "The Fellowship of the Ring",
        authors: "J. R. R. Tolkien",
        isbn: "978-0-00-000001-1",
        seriesName: "The Lord of the Rings",
        seriesPosition: 1,
        seriesTotal: 3,
      }),
      book({
        id: "copy-2",
        title: "The Fellowship of the Ring",
        authors: "J. R. R. Tolkien",
        isbn: "9780000000011",
        seriesName: "The Lord of the Rings",
        seriesPosition: 1,
        seriesTotal: 3,
      }),
      book({
        id: "book-2",
        title: "The Two Towers",
        authors: "J. R. R. Tolkien",
        seriesName: "The Lord of the Rings",
        seriesPosition: 2,
        seriesTotal: 3,
      }),
    ])

    expect(collections).toHaveLength(1)
    expect(collections[0].ownedCount).toBe(2)
    expect(collections[0].totalCount).toBe(3)
    expect(collections[0].books[0].copyCount).toBe(2)
  })

  it("does not count duplicate copies toward author totals", () => {
    const collections = buildAuthorCollections([
      book({ id: "copy-1", title: "Dune", authors: "Frank Herbert" }),
      book({ id: "copy-2", title: "Dune", authors: "Frank Herbert" }),
      book({ id: "book-2", title: "Dune Messiah", authors: "Frank Herbert" }),
    ])

    expect(collections).toHaveLength(1)
    expect(collections[0].ownedCount).toBe(2)
    expect(collections[0].books[0].copyCount).toBe(2)
  })
})
