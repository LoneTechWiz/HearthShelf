import { describe, expect, it } from "vitest"
import {
  buildBookAuthorCollections,
  buildBookSeriesCollections,
  buildMovieDirectorCollections,
  buildGameCategoryCollections,
  type CollectionBook,
  type CollectionMovie,
  type CollectionGame,
} from "@/lib/shelf-collections"

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
    const collections = buildBookSeriesCollections([
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
    expect(collections[0].items[0].copyCount).toBe(2)
  })

  it("does not count duplicate copies toward author totals", () => {
    const collections = buildBookAuthorCollections([
      book({ id: "copy-1", title: "Dune", authors: "Frank Herbert" }),
      book({ id: "copy-2", title: "Dune", authors: "Frank Herbert" }),
      book({ id: "book-2", title: "Dune Messiah", authors: "Frank Herbert" }),
    ])

    expect(collections).toHaveLength(1)
    expect(collections[0].ownedCount).toBe(2)
    expect(collections[0].items[0].copyCount).toBe(2)
  })

  it("groups movies by director", () => {
    const movies: CollectionMovie[] = [
      { id: "m1", title: "Inception", director: "Christopher Nolan", year: 2010, posterUrl: null, genre: "Sci-Fi", format: null },
      { id: "m2", title: "Interstellar", director: "Christopher Nolan", year: 2014, posterUrl: null, genre: "Sci-Fi", format: null },
    ]

    const collections = buildMovieDirectorCollections(movies)

    expect(collections).toHaveLength(1)
    expect(collections[0].name).toBe("Christopher Nolan")
    expect(collections[0].ownedCount).toBe(2)
  })

  it("groups games by category", () => {
    const games: CollectionGame[] = [
      { id: "g1", title: "Catan", coverUrl: null, genre: "Strategy", minPlayers: 3, maxPlayers: 4, ageRating: null },
      { id: "g2", title: "Ticket to Ride", coverUrl: null, genre: "Strategy", minPlayers: 2, maxPlayers: 5, ageRating: null },
    ]

    const collections = buildGameCategoryCollections(games)

    expect(collections).toHaveLength(1)
    expect(collections[0].name).toBe("Strategy")
    expect(collections[0].ownedCount).toBe(2)
  })
})
