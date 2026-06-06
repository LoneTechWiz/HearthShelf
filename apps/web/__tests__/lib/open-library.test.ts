import { describe, it, expect, vi, beforeEach } from "vitest"
import { searchByTitle, lookupByIsbn } from "@/lib/open-library"

describe("searchByTitle", () => {
  beforeEach(() => vi.restoreAllMocks())

  it("returns mapped suggestions from API response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        docs: [
          {
            title: "Dune",
            author_name: ["Frank Herbert"],
            isbn: ["9780441013593"],
            cover_i: 8839523,
          },
        ],
      }),
    }))
    const results = await searchByTitle("Dune")
    expect(results).toEqual([{
      title: "Dune",
      authors: "Frank Herbert",
      isbn: "9780441013593",
      coverUrl: "https://covers.openlibrary.org/b/id/8839523-S.jpg",
      description: null,
    }])
  })

  it("skips docs without an isbn", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        docs: [{ title: "No ISBN Book", author_name: ["Author"] }],
      }),
    }))
    const results = await searchByTitle("No ISBN")
    expect(results).toEqual([])
  })

  it("throws when response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }))
    await expect(searchByTitle("Dune")).rejects.toThrow("Search failed")
  })
})

describe("lookupByIsbn", () => {
  beforeEach(() => vi.restoreAllMocks())

  it("returns book details for a valid ISBN", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        "ISBN:9780441013593": {
          title: "Dune",
          authors: [{ name: "Frank Herbert" }],
          cover: { medium: "https://covers.openlibrary.org/b/id/8839523-M.jpg" },
          description: "A science fiction novel.",
        },
      }),
    }))
    const result = await lookupByIsbn("9780441013593")
    expect(result).toEqual({
      title: "Dune",
      authors: "Frank Herbert",
      isbn: "9780441013593",
      coverUrl: "https://covers.openlibrary.org/b/id/8839523-M.jpg",
      description: "A science fiction novel.",
    })
  })

  it("handles description as object with value property", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        "ISBN:9780441013593": {
          title: "Dune",
          authors: [],
          description: { value: "A science fiction novel." },
        },
      }),
    }))
    const result = await lookupByIsbn("9780441013593")
    expect(result?.description).toBe("A science fiction novel.")
  })

  it("returns null when ISBN is not found", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }))
    const result = await lookupByIsbn("0000000000")
    expect(result).toBeNull()
  })

  it("throws when response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }))
    await expect(lookupByIsbn("9780441013593")).rejects.toThrow("Lookup failed")
  })
})
